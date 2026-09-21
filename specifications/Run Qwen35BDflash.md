# DFlash and Qwen 3.6 35B A3B

**Run DFlash:**
```shell

 ./llama.cpp/build/bin/llama-server  -m /models/Qwen3.6-35B-A3B/Qwen_Qwen3.6-35B-A3B-Q4_K_M.gguf -md /models/Qwen3.6-35B-A3B/qwen36-35b-a3b-dflash-Q4_K_M.gguf -ngld 999 -ngl 999 -fa on --ctx-size 131072 --batch-size 2048 --ubatch-size 512 --cache-type-k q8_0 --cache-type-v q8_0 --kv-unified --spec-type draft-dflash --spec-draft-n-max 8 --spec-draft-type-k q8_0 --spec-draft-type-v q8_0 --jinja --parallel 1 --host 0.0.0.0 --fit off



[Qwen3.6-35B-A3B-UD]
model = /models/Qwen3.6-35B-A3B/Qwen3.6-35B-A3B-UD-Q4_K_M.gguf
parallel=1
alias = qwen3.6-35B-UD
cache-type-k = q8_0 
cache-type-v = q8_0
spec-draft-type-k = q8_0
spec-draft-type-v = q8_0
ctx-size = 262144
gpu-layers = 99
batch-size = 4096
ubatch-size =1024
spec-type = draft-mtp
spec-draft-n-max = 6
//spec-draft-n-min = 0
repeat-penalty = 1.1
presence-penalty = 0.0
frequency-penalty = 0.0
temperature = 0.5
top-p = 0.95
top-k = 20
min-p = 0.0

//And --Fit off

```  