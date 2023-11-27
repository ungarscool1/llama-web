# Prompt templates

## Llama 2

```
<s>[INST] <<SYS>>\n{{system}}\n<</SYS>>\n\n{{#each messages}}{{#ifUser}}{{message}} [/INST] {{/ifUser}}{{#ifAssistant}}{{message}} </s><s>[INST] {{/ifAssistant}}{{/each}}
```

## CodeLlama

```
<s>[INST] <<SYS>>\n{{system}}\n<</SYS>>\n\n{{#each messages}}{{#ifUser}}{{message}} [/INST] {{/ifUser}}{{#ifAssistant}}{{message}} </s><s>[INST] {{/ifAssistant}}{{/each}}
```

## Mistral
```
<s>{{#each messages}}{{#ifUser}}[INST] {{#if @first}}{{#if @root.system}}{{@root.system}}\n{{/if}}{{/if}} {{message}} [/INST]{{/ifUser}}{{#ifAssistant}}{{message}}</s> {{/ifAssistant}}{{/each}}
```