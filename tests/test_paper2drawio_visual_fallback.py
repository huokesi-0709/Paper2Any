import cv2
import numpy as np

from dataflow_agent.workflow.wf_paper2drawio_sam3 import (
    FontSizeProcessor,
    _build_visual_fallback_elements,
    _detect_text_ink_bbox,
    _infer_text_color,
    _remove_text_ink_preserving_lines,
    _should_use_visual_fallback,
    _text_style_from_block,
    _text_block_bbox,
    _vectorize_text_blocks,
)


def test_empty_sam3_results_force_visual_fallback_even_with_background_panels():
    background_panels = [
        {"kind": "shape", "group": "background"},
        {"kind": "shape", "group": "background"},
        {"kind": "shape", "group": "background"},
    ]

    assert _should_use_visual_fallback([], background_panels, ["circuit board"])


def test_missing_image_elements_force_fallback_when_visual_prompts_exist():
    sam3_results = [{"group": "background", "bbox": [0, 0, 100, 100]}]
    background_panels = [{"kind": "shape", "group": "background"}]

    assert _should_use_visual_fallback(sam3_results, background_panels, ["microchip"])


def test_detected_image_element_keeps_editable_reconstruction():
    sam3_results = [{"group": "image", "bbox": [10, 10, 80, 80]}]
    elements = [{"kind": "image", "group": "image"}]

    assert not _should_use_visual_fallback(sam3_results, elements, ["microchip"])


def test_text_semantics_do_not_switch_reconstruction_font_family():
    blocks = _vectorize_text_blocks(
        [
            {"rotate_rect": [300, 100, 220, 40, 0], "text": "result_analysis"},
            {"rotate_rect": [300, 180, 500, 40, 0], "text": "Long academic result, method, and analysis."},
        ],
        image_w=1000,
        image_h=1000,
    )

    assert [block["font_family"] for block in blocks] == ["Arial", "Arial"]


def test_ocr_font_style_hints_are_preserved_and_normalized():
    block = _vectorize_text_blocks(
        [
            {
                "rotate_rect": [500, 100, 400, 60, 0],
                "text": "Section heading",
                "font_family": "condensed sans-serif",
                "font_weight": "bold",
                "font_style": "italic",
                "font_color": "#125a9c",
            }
        ],
        image_w=1000,
        image_h=1000,
    )[0]

    assert block["font_family"] == "Arial Narrow"
    assert block["font_weight"] == "bold"
    assert block["font_style"] == "italic"
    assert block["font_color"] == "#125A9C"


def test_long_text_bbox_recovers_width_clipped_by_ocr():
    text = "Edge-side diagnostics support feasibility on a low-power ARM64 device, while substantial tail latency remains (P95 ≈ 26.5 s)."
    block = {
        "text": text,
        "font_size": 25.143,
        "geometry": {"x": 306, "y": 991, "width": 918, "height": 51},
    }

    bbox = _text_block_bbox(block, image_w=1456, image_h=1080)

    assert bbox is not None
    assert bbox[0] <= 165
    assert bbox[2] >= 1365


def test_font_size_is_height_led_when_ocr_width_is_clipped():
    block = {
        "text": "A deliberately long line whose OCR box is too narrow",
        "geometry": {"x": 100, "y": 20, "width": 260, "height": 50},
    }

    result = FontSizeProcessor().process([block], unify=False)[0]

    assert 23 <= result["font_size"] <= 27


def test_visual_fallback_removes_full_text_line_from_flat_background(tmp_path):
    image = np.full((600, 1000, 3), 255, dtype=np.uint8)
    cv2.putText(image, "Editable diagram text", (360, 312), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 0), 2)
    block = {
        "text": "Editable diagram text",
        "font_size": 24,
        "geometry": {"x": 350, "y": 278, "width": 370, "height": 44},
    }

    elements, hide_text = _build_visual_fallback_elements(image, [block], tmp_path)
    cleaned = cv2.imread(elements[0]["image_path"])

    assert hide_text is False
    assert cleaned is not None
    assert int(np.count_nonzero(cleaned < 80)) < int(np.count_nonzero(image < 80)) * 0.1


def test_ink_bbox_recovers_clipped_suffix_without_absorbing_left_icon():
    image = np.full((160, 520, 3), 255, dtype=np.uint8)
    cv2.circle(image, (42, 80), 24, (80, 80, 80), -1)
    cv2.putText(image, "14.40 s", (92, 91), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 0), 2)

    bbox = _detect_text_ink_bbox(image, [105, 58, 185, 103])

    assert bbox is not None
    assert bbox[0] >= 85
    assert bbox[2] >= 205


def test_numbered_badge_is_not_duplicated_in_editable_heading():
    image = np.full((180, 700, 3), 255, dtype=np.uint8)
    cv2.circle(image, (48, 56), 26, (30, 100, 25), -1)
    cv2.putText(image, "1", (40, 66), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
    cv2.putText(image, "Hardware platform", (88, 68), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (30, 100, 25), 2)
    item = {
        "bbox": [25 / 180 * 1000, 76 / 700 * 1000, 82 / 180 * 1000, 360 / 700 * 1000],
        "text": "1 Hardware platform",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "font_color": "#000000",
        "text_align": "left",
    }

    block = _vectorize_text_blocks([item], 700, 180, image_bgr=image)[0]
    style = _text_style_from_block(block)

    assert block["text"] == "Hardware platform"
    assert block["font_weight"] == "bold"
    assert block["ink_bbox"][0] >= 80
    assert "fontStyle=1" in style
    assert "align=center" in style


def test_precise_condensed_text_is_width_constrained():
    processor = FontSizeProcessor()
    block = {
        "text": "Average throughput",
        "font_family": "condensed sans-serif",
        "text_align": "left",
        "ink_bbox": [100, 40, 257, 60],
        "geometry": {"x": 100, "y": 34, "width": 157, "height": 33},
    }

    result = processor.process([block], unify=False)[0]

    assert 18 <= result["font_size"] <= 22


def test_refined_image_text_uses_condensed_font_and_original_center():
    image = np.full((160, 620, 3), 255, dtype=np.uint8)
    text_layer = np.full((50, 360, 3), 255, dtype=np.uint8)
    cv2.putText(text_layer, "Average throughput", (4, 32), cv2.FONT_HERSHEY_PLAIN, 1.4, (0, 0, 0), 2)
    condensed_layer = cv2.resize(text_layer, None, fx=0.62, fy=1.0, interpolation=cv2.INTER_AREA)
    image[56:106, 170:170 + condensed_layer.shape[1]] = condensed_layer
    item = {
        "bbox": [50 / 160 * 1000, 180 / 620 * 1000, 105 / 160 * 1000, 390 / 620 * 1000],
        "text": "Average throughput",
        "font_family": "sans-serif",
        "font_weight": "normal",
        "font_style": "normal",
        "font_color": "#000000",
        "text_align": "left",
    }

    block = _vectorize_text_blocks([item], 620, 160, image_bgr=image)[0]
    style = _text_style_from_block(block)

    assert block["font_family"] == "Arial Narrow"
    assert block["text_align"] == "center"
    assert "align=center" in style


def test_text_color_inference_does_not_choose_near_white_background():
    image = np.full((80, 220, 3), (252, 248, 243), dtype=np.uint8)
    cv2.putText(image, "Model:", (30, 52), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 0), 2)

    color = _infer_text_color(image, [20, 15, 165, 65])

    assert color is not None
    rgb = tuple(int(color[index:index + 2], 16) for index in (1, 3, 5))
    assert sum(rgb) / 3 < 100


def test_pixel_text_cleanup_preserves_box_border():
    image = np.full((100, 240, 3), 255, dtype=np.uint8)
    cv2.rectangle(image, (20, 15), (220, 85), (80, 40, 120), 2)
    cv2.putText(image, "Text near border", (65, 77), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 2)
    cleaned = image.copy()

    _remove_text_ink_preserving_lines(cleaned, image, [55, 53, 224, 90], (255, 255, 255))

    assert int(np.count_nonzero(cleaned[84:87, 18:223] < 200)) >= int(np.count_nonzero(image[84:87, 18:223] < 200)) * 0.9
    assert int(np.count_nonzero(cleaned[55:82, 55:210] < 80)) < int(np.count_nonzero(image[55:82, 55:210] < 80)) * 0.25
