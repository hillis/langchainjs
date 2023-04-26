import { BaseLanguageModel } from "../base_language/index.js";
import { CallbackManager, getCallbackManager } from "../callbacks/index.js";
import { BufferMemory } from "../memory/buffer_memory.js";
import { Tool } from "../tools/base.js";
import { ChatAgent } from "./chat/index.js";
import { ChatConversationalAgent } from "./chat_convo/index.js";
import { AgentExecutor } from "./executor.js";
import { ZeroShotAgent } from "./mrkl/index.js";

type AgentType =
  | "zero-shot-react-description"
  | "chat-zero-shot-react-description"
  | "chat-conversational-react-description";

export const initializeAgentExecutor = async (
  tools: Tool[],
  llm: BaseLanguageModel,
  _agentType?: AgentType,
  _verbose?: boolean,
  _callbackManager?: CallbackManager
): Promise<AgentExecutor> => {
  const agentType = _agentType ?? "zero-shot-react-description";
  const verbose = _verbose ?? !!_callbackManager;
  const callbackManager = _callbackManager ?? getCallbackManager();
  switch (agentType) {
    case "zero-shot-react-description":
      return AgentExecutor.fromAgentAndTools({
        agent: ZeroShotAgent.fromLLMAndTools(llm, tools),
        tools,
        returnIntermediateSteps: true,
        verbose,
        callbackManager,
      });
    case "chat-zero-shot-react-description":
      return AgentExecutor.fromAgentAndTools({
        agent: ChatAgent.fromLLMAndTools(llm, tools),
        tools,
        returnIntermediateSteps: true,
        verbose,
        callbackManager,
      });
    case "chat-conversational-react-description":
      return AgentExecutor.fromAgentAndTools({
        agent: ChatConversationalAgent.fromLLMAndTools(llm, tools),
        tools,
        verbose,
        callbackManager,
      });
    default:
      throw new Error("Unknown agent type");
  }
};

type AgentExecutorOptions =
  | ({
      agentType: "zero-shot-react-description";
      agentArgs?: Parameters<typeof ZeroShotAgent.fromLLMAndTools>[2];
    } & Omit<
      Parameters<typeof AgentExecutor.fromAgentAndTools>[0],
      "agent" | "tools" | "memory"
    >)
  | ({
      agentType: "chat-zero-shot-react-description";
      agentArgs?: Parameters<typeof ChatAgent.fromLLMAndTools>[2];
    } & Omit<
      Parameters<typeof AgentExecutor.fromAgentAndTools>[0],
      "agent" | "tools" | "memory"
    >)
  | ({
      agentType: "chat-conversational-react-description";
      agentArgs?: Parameters<typeof ChatConversationalAgent.fromLLMAndTools>[2];
    } & Omit<
      Parameters<typeof AgentExecutor.fromAgentAndTools>[0],
      "agent" | "tools"
    >);

export const initializeAgentExecutorWithOptions = async (
  tools: Tool[],
  llm: BaseLanguageModel,
  options: AgentExecutorOptions = {
    agentType:
      llm._modelType() === "base_chat_model"
        ? "chat-zero-shot-react-description"
        : "zero-shot-react-description",
  }
): Promise<AgentExecutor> => {
  switch (options.agentType) {
    case "zero-shot-react-description": {
      const { agentArgs, ...rest } = options;
      return AgentExecutor.fromAgentAndTools({
        agent: ZeroShotAgent.fromLLMAndTools(llm, tools, agentArgs),
        tools,
        ...rest,
      });
    }
    case "chat-zero-shot-react-description": {
      const { agentArgs, ...rest } = options;
      return AgentExecutor.fromAgentAndTools({
        agent: ChatAgent.fromLLMAndTools(llm, tools, agentArgs),
        tools,
        ...rest,
      });
    }
    case "chat-conversational-react-description": {
      const { agentArgs, memory, ...rest } = options;
      const executor = AgentExecutor.fromAgentAndTools({
        agent: ChatConversationalAgent.fromLLMAndTools(llm, tools, agentArgs),
        tools,
        memory:
          memory ??
          new BufferMemory({
            returnMessages: true,
            memoryKey: "chat_history",
            inputKey: "input",
          }),
        ...rest,
      });
      return executor;
    }
    default: {
      throw new Error("Unknown agent type");
    }
  }
};
