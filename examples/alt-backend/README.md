# Alternative backend

These examples show how to use the alternative backend using modal.com.

## Mixtral 8X7B

The code is taken from their [documentation](https://modal.com/docs/examples/vllm_mixtral) and adapted to work with out web interface.

### Deploy
  
  ```bash
  modal deploy mixtral8x7B.py
  ```

## Mistral 7B Instruct v0.2

We take the same code as the previous example and we adapt it to work with this model.

### Before the deployment

You need to create a secret containing `AUTH_TOKEN` variable. This token is used to authenticate the request to the API. YOU NEED TO CALL THE SECRET `web-token`.

### Deploy
  
  ```bash
  modal deploy mistral-7B-instruct.py
  ```

## More models ?

More models example will be added soon !