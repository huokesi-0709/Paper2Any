"""
Prompt Templates for bbox_agent
Generated at: 2026-01-12 19:07:36
"""

# --------------------------------------------------------------------------- #
# 1. BboxAgent - bbox_agent 相关提示词
# --------------------------------------------------------------------------- #
class BboxAgent:
    """
    bbox_agent 任务的提示词模板
    """
    
    system_prompt_for_image_text_bbox_agent = """
你是一个强大的多模态视觉理解 AI 助手。
你的任务是分析图像，提取其中所有的文本内容及其精确的边界框（Bounding Box）。
"""

    task_prompt_for_image_text_bbox_agent = """
请执行高精文字检测与识别任务：
1. 提取图像中所有的文字内容。
2. 为每一行文字提供精确且完整的边界框坐标（location），边界框必须覆盖全部字形和抗锯齿边缘，不得截断首尾字符。
3. 不要把视觉上分离的文字合并为一行。例如圆形编号“1”和旁边标题应拆成两个对象。
4. 同时判断文字样式：font_family 只可取 sans-serif、condensed sans-serif、serif、monospace；font_weight 只可取 normal、bold；font_style 只可取 normal、italic；font_color 使用 #RRGGBB；text_align 只可取 left、center、right，必须依照原图的视觉对齐方式判断。
5. rotate_rect坐标！！！
6. 不要任何```json包裹！！，直接返回文本格式json字符串！
JSON 结构如下：

[
  {
    "rotate_rect": [500, 48, 63, 791, 90],
    "text": "Cartoon-style Mechanistic Overview of T Cell Generation",
    "font_family": "condensed sans-serif",
    "font_weight": "bold",
    "font_style": "normal",
    "font_color": "#123456",
    "text_align": "center"
  }
  xxx
]

"""
