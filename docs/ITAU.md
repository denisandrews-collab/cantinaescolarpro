# Integração com Itaú

Este documento descreve como configurar placeholders para integração com Itaú e onde armazenar segredos com segurança.

## Variáveis de ambiente (ex.: .env / GitHub Secrets)
- ITAU_API_URL
- ITAU_CLIENT_ID
- ITAU_CLIENT_SECRET
- ITAU_MERCHANT_ID
- ITAU_CERT_PATH
- ITAU_PEM_PASSWORD
- ITAU_PIX_KEY

## Configuração local
1. Copie `.env.example` para `.env` e preencha com valores locais (NUNCA comite `.env`).
2. Verifique `config/itau.yml` para garantir que sua aplicação carrega variáveis de ambiente no runtime.

## GitHub Actions / CI
Adicione os valores sensíveis como GitHub Secrets (Settings → Secrets) com os mesmos nomes das variáveis. No workflow, referencie-os como:

```yaml
- name: Set env
  env:
    ITAU_CLIENT_ID: ${{ secrets.ITAU_CLIENT_ID }}
    ITAU_CLIENT_SECRET: ${{ secrets.ITAU_CLIENT_SECRET }}
    ITAU_API_URL: ${{ secrets.ITAU_API_URL }}
```

## Segurança
- Nunca commit chaves privadas, PEMs ou segredos no repositório.
- Se for usar certificados PEM, prefira armazenar o arquivo em um storage seguro e referenciar o caminho via variável de ambiente ou usar um serviço de secrets.

## Exemplo de uso
- O backend deve ler `config/itau.yml` e substituir placeholders a partir das variáveis de ambiente.
- Documente com o time quais permissões e escopos o Client ID/Secret possuem.
