# Qwen 3.6 DFlash for Kraftwerk

```shell
./llama.cpp/build/bin/llama-server  -m /models/Qwen3.6-35B-A3B/Qwen_Qwen3.6-35B-A3B-Q4_K_M.gguf -md /models/Qwen3.6-35B-A3B/qwen36-35b-a3b-dflash-Q4_K_M.gguf --mmproj /models/Qwen3.6-35B-A3B/mmproj-F32.gguf -ngld 999 -ngl 999 -fa on --ctx-size 262144 --batch-size 4096 --ubatch-size 1024 --cache-type-k q8_0 --cache-type-v q8_0 --kv-unified --spec-type draft-dflash --spec-draft-n-max 12 --spec-draft-type-k q8_0 --spec-draft-type-v q8_0 --jinja --parallel 2 --host 0.0.0.0 --port 8082 --fit off --metrics --tools all --webui-mcp-proxy --reasoning-preserve
```

KWARG is OLD use --reasoning on / off 
dont forget --reasoning-preserve for qwen models

--chat-template-kwargs '{"enable_thinking":true}'
--chat-template-kwargs '{"enable_thinking":false}'
--reasoning-budget 4096


```
./llama.cpp/build/bin/llama-server  -m /models/Qwen3.6-35B-A3B/Qwen_Qwen3.6-35B-A3B-Q4_K_M.gguf -md /models/Qwen3.6-35B-A3B/qwen36-35b-a3b-dflash-Q4_K_M.gguf --mmproj /models/Qwen3.6-35B-A3B/mmproj-F32.gguf -ngld 999 -ngl 999 -fa on --ctx-size 262144 --batch-size 2048 --ubatch-size 1024 --cache-type-k q8_0 --cache-type-v q8_0 --kv-unified --spec-type draft-dflash --spec-draft-n-max 10 --spec-draft-type-k q8_0 --spec-draft-type-v q8_0 --jinja --parallel 2 --host 0.0.0.0 --port 8082 --fit off --metrics --tools all --webui-mcp-proxy --reasoning-preserve --reasoning on
```
# Qwen 3.8 27B Unsloth
#### Qwen3.8-**27B Settings:**[](https://unsloth.ai/docs/models/qwen3.8#qwen3.8-27b-settings)

Qwen3.8-27B is a **hybrid thinking** model with different default settings for thinking and non-thinking modes. Extra high is enabled by default so if you want shorter thinking traces, you can [adjust the thinking effort](https://unsloth.ai/docs/models/qwen3.8#thinking--preserve-thinking):

| Parameter          | Thinking Mode | Instruct (non-thinking) Mode |
| ------------------ | ------------- | ---------------------------- |
| temperature        | 1.0           | 0.7                          |
| top_p              | 0.95          | 0.80                         |
| top_k              | 20            | 20                           |
| min_p              | 0.0           | 0.0                          |
| presence_penalty   | 0.0           | 1.5                          |
| repetition_penalty | 1.0           | 1.0                          |

- **Maximum context window:** `262,144` (can be extended to 1M via YaRN)
- **Thinking Mode:** `temperature=1.0`, `top_p=0.95`, `top_k=20`, `min_p=0.0`, `presence_penalty=0.0`, `repetition_penalty=1.0`
- **Instruct (or non-thinking) mode:** `temperature=0.7`, `top_p=0.80`, `top_k=20`, `min_p=0.0`, `presence_penalty=1.5`, `repetition_penalty=1.0`
- **reasoning_effort** | `xhigh` | `medium` | `low` | `none` |
- 

```shell

```