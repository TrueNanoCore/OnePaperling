# Qwen models, llama.cpp and DFlash draft models
> **Lllama.cpp server and cli** has lacked the support of diffusion draft models. These models are inherently parallel and a lot faster than MTP prediction.
> Drawbacks are the mainly the need to run two models at the same time, meaning that draft average length and acceptance frequence are core parameters to track.
> As speedup is the goal, specifying **too long drafts** resulting in a sub-optimal performance curve as the excess computations needed exceed the computational gains. **Now, however** llama.cpp has DFlash support.
**Expected speedups:**
> **Dense models (27B etc)** 


**Practical amounts of ram needed to run Qwen3.8 27B locally:**

| Brand                     | Minimum dedicated VRam | expeted TPS |
| ------------------------- | ---------------------- | ----------- |
| NVidia GB-10 Spark        | 128GB stadard          | 4           |
| NVidia 3,4,5- 090 series  | 24GB+                  | 5           |
| AMD AiMax 390 and up      | 32GB (64GB totals)     | 3           |
| Mac m3pro+                | 24 GB(48GB system)     | 4           |
| ------------------------- |                        |             |

# Qwen 3.8 27B DFlash draft model.
> **Being the prime** private inference model taking size, hardware needs and result into account, at the moment very few are even close to Qwen 3.8 27B - the model **actually** gives last years champion Opus 4.6 a run for the money. In a 27B parameter model that runs on consumer hardware such as 5090, GB-10, AiMax 39* and almost all mac m3+ machines with enough unified memory available. 
