<h1 align="center">🚀 Sistema B2B Orders Orchestrator</h1>

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-v22-green?logo=node.js" />
  <img src="https://img.shields.io/badge/Express.js-blue?logo=express" />
  <img src="https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql" />
  <img src="https://img.shields.io/badge/Docker-Compose-blue?logo=docker" />
  <img src="https://img.shields.io/badge/Serverless-AWS_Lambda-yellow?logo=aws-lambda" />
</div>

<p align="center">
  <b>Sistema de gestión de clientes y pedidos B2B</b><br>
  Incluye dos APIs (Customers & Orders) y un Lambda Orquestador que automatiza la creación y confirmación de pedidos.
</p>

---

## 🧩 Configuración Local

### 📋 Prerrequisitos
- Node.js (v22)  
- Docker y Docker Compose  
- AWS CLI (opcional, para despliegue)  
- ngrok (opcional, para despliegue)  

### 🧾 Pasos de Instalación

#### Configuración variables de entorno
Configura las variables de entorno: En cada una de las carpetas de servicio (/customers-api, /orders-api, /lambda-orchestrator), encontrarás un archivo `.env.example`.  
Crea una copia de cada uno y renómbrala a `.env`. Los valores por defecto están configurados para el entorno local.

> NOTA: Para lambda-orchestrador existen dos configuraciones especificadas en `.env.example`.  
> Una para levantarlo localmente y otra para Docker.

### Ejecución

En caso de querer ejecutar Lambda Orquestador <b>localmente</b> en el archivo <code>/lambda-orchestrator/.env</code> utilizar:

```bash
CUSTOMERS_API_BASE=http://localhost:3001
ORDERS_API_BASE=http://localhost:3002
SERVICE_TOKEN=SERVICE_TOKEN
```

Ubicarse en <code>/lambda-orchestrator/</code> y ejecutar: 

```bash
npm run dev
```
En caso de querer ejecutar Lambda Orquestador con <b>docker</b> en el archivo <code>/lambda-orchestrator/.env</code> utilizar:

```bash
CUSTOMERS_API_BASE: http://customers-api:3001
ORDERS_API_BASE: http://orders-api:3002
SERVICE_TOKEN: SERVICE_TOKEN
```

Desde la raíz del proyecto, ejecuta el siguiente comando:

```bash
docker-compose up --build -d
```

<h2 align="center">✅ Verificación y Pruebas</h2>

<p align="center">
Puedes verificar que todo esté funcionando accediendo a las siguientes URLs:
</p>

<table align="center">
  <tr>
    <td><b>Customers API</b></td>
    <td><a href="http://localhost:3001/health">http://localhost:3001/health</a></td>
  </tr>
  <tr>
    <td><b>Orders API</b></td>
    <td><a href="http://localhost:3002/health">http://localhost:3002/health</a></td>
  </tr>
  <tr>
    <td><b>Lambda Orquestador</b></td>
    <td><a href="http://localhost:3003">http://localhost:3003</a></td>
  </tr>
</table>

---

<h3>🧪 Cómo Probar el Sistema</h3>

<p>Para probar el flujo completo, se debe enviar una petición POST al Lambda Orquestador.</p>

<b>Endpoint de Prueba: </b>POST <a href="http://localhost:3003">http://localhost:3003/orchestrator/create-and-confirm-order</a>

<b>Ejemplo con cURL:</b>

```bash
curl -X POST http://localhost:3003/orchestrator/create-and-confirm-order \
-H "Content-Type: application/json" \
-d '{
  "customer_id": 1,
  "items": [
    { "product_id": 2, "qty": 1 }
  ],
  "idempotency_key": "una-clave-unica-por-peticion"
}'
```

Respuesta Esperada (201 Created)
Si la operación es exitosa, recibirá un JSON consolidado con los datos del cliente y la orden ya confirmada.
```bash
{
    "success": true,
    "data": {
        "customer": {
            "id": 1,
            "name": "ACME Corporation",
            "email": "contact@acme.com",
            "phone": "555-0101"
        },
        "order": {
            "id": 1,
            "status": "CONFIRMED",
            "total_cents": 129900,
            "items": [
                {
                    "product_id": 2,
                    "qty": 1,
                    "unit_price_cents": 129900,
                    "subtotal_cents": 129900
                }
            ]
        }
    }
}
```
<h3>☁️ Despliegue en AWS</h3> 
<ol> <li><b>Configura tus credenciales de AWS:</b> Asegúrate de tener el AWS CLI configurado con tus credenciales. <pre><code>aws configure</code></pre> </li> <li><b>Expón tus APIs locales con ngrok:</b> El Lambda en la nube necesita una URL pública para comunicarse con tus APIs locales. Usa ngrok para crear túneles.</li> <li><b>Copia las URLs públicas</b> que ngrok te proporcione (https://....ngrok-free.app).</li> <li><b>Actualiza el archivo <code>serverless.yml</code>:</b> En <code>/lambda-orchestrator/serverless.yml</code>, actualiza las variables de entorno <code>CUSTOMERS_API_BASE</code> y <code>ORDERS_API_BASE</code> con las URLs de ngrok.</li> <li><b>Despliega el Lambda:</b> Desde la carpeta <code>/lambda-orchestrator</code>, ejecuta: <pre><code>npm run deploy</code></pre> </li> </ol> <p>Al finalizar, la terminal te proporcionará la URL pública de tu Lambda en AWS. Ya puedes usar esa URL en Postman para probar el sistema en un entorno real.</p>

