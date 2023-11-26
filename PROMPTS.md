# Prompt templates

## Llama 2

```env
<s>[INST] <<SYS>>\n{{system}}\n<</SYS>>\n\n{{#each messages}}{{#ifUser}}{{message}} [/INST] {{/ifUser}}{{#ifAssistant}}{{message}} </s><s>[INST] {{/ifAssistant}}{{/each}}
```

## CodeLlama

```env
<s>[INST] <<SYS>>\n{{system}}\n<</SYS>>\n\n{{#each messages}}{{#ifUser}}{{message}} [/INST] {{/ifUser}}{{#ifAssistant}}{{message}} </s><s>[INST] {{/ifAssistant}}{{/each}}
```
