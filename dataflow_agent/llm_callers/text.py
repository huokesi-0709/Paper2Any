from typing import List
from langchain_core.messages import BaseMessage,AIMessage
from langchain_openai import ChatOpenAI

from .base import BaseLLMCaller
from dataflow_agent.logger import get_logger
from dataflow_agent.utils.request_options import chat_model_options

log = get_logger(__name__)

class TextLLMCaller(BaseLLMCaller):
    """文本LLM调用器 - 原有实现"""
    
    async def call(self, messages: List[BaseMessage], bind_post_tools: bool = False) -> AIMessage:
        log.debug(f"TextLLM调用，模型: {self.model_name}")
        
        tools = []
        if bind_post_tools and self.tool_manager:
            tools = self.tool_manager.get_post_tools("current_role")

        llm = ChatOpenAI(
            openai_api_base=self.state.request.chat_api_url,
            openai_api_key=self.state.request.api_key,
            model_name=self.model_name,
            **chat_model_options(
                self.model_name,
                temperature=self.temperature,
                has_tools=bool(tools),
            ),
            # max_tokens=self.max_tokens,
        )
        
        # 绑定工具（如果需要）
        if tools:
            llm = llm.bind_tools(tools, tool_choice=self.tool_mode)
            log.info(f"为LLM绑定了 {len(tools)} 个工具")
        
        response = await llm.ainvoke(messages)
        log.info(
            "[LLM Output]\n"
            "api_key=<configured>\n"
            f"model={self.model_name}\n"
            "output=\n"
            f"{response.content}"
        )
        return response
