const path = require("path");
const { GPT4All } = require("gpt4all"); // proper import

async function summarizeEvents(text) {
  // Absolute path to the downloaded model
  const modelPath = path.resolve("C:/Users/PC/.cache/gpt4all/models/ggml-gpt4all-j-v1.3-groovy.bin");

  // Load the model (GPT4All.loadModel returns a promise)
  const model = await GPT4All.loadModel(modelPath);

  // Generate text
  const result = await model.generate(text, {
    temperature: 0.3,
    max_tokens: 300,
  });

  return result;
}

// Example usage
summarizeEvents("Test prompt")
  .then(console.log)
  .catch(console.error);
