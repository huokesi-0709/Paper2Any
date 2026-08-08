"""
Playwright + Chromium 实战演示：联网检索研究 Agent 的最小可用版。
作用：用无头 Chromium（带 stealth 反爬伪装）打开真实网页，
     等待 JS 渲染后提取正文，保存到本地——这正是 Paper2Any 里
     websearch_researcher 的核心能力。

用法（在项目根目录、已激活 .venv 下）：
    .venv\\Scripts\\python.exe script\\demo_websearch.py
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright
from playwright_stealth import Stealth

# 目标：一篇 arXiv 论文摘要页（bot 友好，适合演示）
TARGET_URL = "https://arxiv.org/abs/1706.03762"  # Attention Is All You Need
OUT_PATH = Path(__file__).resolve().parent.parent / "outputs" / "websearch_demo.md"


async def main() -> int:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Stealth().use_async(async_playwright()) 作为上下文管理器，
    # 对其中创建的所有页面自动应用反爬伪装（与项目 websearch_researcher 用法一致）
    async with Stealth().use_async(async_playwright()) as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36"
            ),
            locale="en-US",
        )
        page = await context.new_page()

        print(f"[*] Chromium 正在打开: {TARGET_URL}")
        await page.goto(TARGET_URL, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1500)  # 等 JS 充分渲染

        title = await page.title()
        # arXiv 摘要页的正文结构稳定，直接定位容器
        abstract = ""
        try:
            abstract = (await page.locator("blockquote.abstract").inner_text()).strip()
        except Exception:
            abstract = ""

        # 顺带抓取页面可见文本长度，证明“渲染后的真实内容”已拿到
        body_text_len = len((await page.locator("body").inner_text()).strip())

        await browser.close()

    md = f"""# Playwright + Chromium 联网检索演示结果

- **目标 URL**: {TARGET_URL}
- **页面标题**: {title}
- **正文（body）可见字符数**: {body_text_len}

## 提取到的摘要（Chromium 渲染后抓取）

{abstract or '（未能定位摘要容器，但页面已成功加载）'}
"""
    OUT_PATH.write_text(md, encoding="utf-8")
    print(f"[+] 完成。标题: {title}")
    print(f"[+] 摘要字符数: {len(abstract)}")
    print(f"[+] 已保存到: {OUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
