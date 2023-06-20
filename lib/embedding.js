import { Configuration, OpenAIApi } from "openai";
import { get_encoding } from "tiktoken";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const EMBEDDING_MODE = "text-embedding-ada-002";
const EMBEDDING_TIMEOUT = 50000; // 50 seconds
const EMBEDDING_MAX_LEN = 1024;

export async function embedding(inputs) {
  const enc = get_encoding("cl100k_base");

  let len = 0;

  // check encoding length of inputs
  for (const i of inputs) {
    len += enc.encode(i).length;

    if (len > EMBEDDING_MAX_LEN) {
      throw new Error(`输入语句超过最大编码长度长度: ${len}`);
    }
  }

  const request = {
    model: EMBEDDING_MODE,
    input: inputs,
  };

  const embeddings = [];
  const { data } = await openai.createEmbedding(request, {
    timeout: EMBEDDING_TIMEOUT,
  });
  for (let j = 0; j < inputs.length; j += 1) {
    embeddings.push(data.data[j].embedding);
  }

  return embeddings
}
