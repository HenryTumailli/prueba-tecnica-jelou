Configuración Local

Prerrequisitos

Node.js (v20 o superior)
Docker y Docker Compose
AWS CLI (opcional, para despliegue)
ngrok (opcional, para despliegue)

Pasos de Instalación

Configuración varibles de entorno

Configura las variables de entorno: En cada una de las carpetas de servicio (/customers-api, /orders-api, /lambda-orchestrator), encontrarás un archivo .env.example. Crea una copia de cada uno y renómbrala a .env. Los valores por defecto están configurados para el entorno local.

Ejecucción
Desde la raíz del proyecto, ejecuta el siguiente comando. Esto construirá las imágenes y levantará los contenedores en segundo plano.

docker-compose up --build -d

Puedes verificar que todo esté funcionando accediendo a las siguientes URLs de salud:

Customers API: http://localhost:3001/health

Orders API: http://localhost:3002/health

El orquestador estará escuchando en http://localhost:3003.

🧪 Cómo Probar el Sistema
Para probar el flujo completo, debes enviar una petición POST al Lambda Orquestador.

Endpoint de Prueba
POST http://localhost:3003/orchestrator/create-and-confirm-order

Ejemplo con cURL

curl -X POST http://localhost:3003/orchestrator/create-and-confirm-order \
-H "Content-Type: application/json" \
-d '{
  "customer_id": 1,
  "items": [
    { "product_id": 2, "qty": 1 }
  ],
  "idempotency_key": "una-clave-unica-por-peticion"
}'

Respuesta Esperada (201 Created)
Si la operación es exitosa, recibirás un JSON consolidado con los datos del cliente y la orden ya confirmada.

JSON

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

Despliegue en AWS
Para desplegar el Lambda Orquestador en AWS, sigue estos pasos.

Configura tus credenciales de AWS: Asegúrate de tener el AWS CLI configurado con tus credenciales.

Comando: aws configure

Expón tus APIs locales con ngrok: El Lambda en la nube necesita una URL pública para comunicarse con tus APIs locales. Usa ngrok para crear túneles.

En una terminal, inicia los túneles para ambas APIs usando el archivo de configuración:

Copia las URLs públicas (https://....ngrok-free.app) que ngrok te proporcione.

Actualiza el archivo serverless.yml: En /lambda-orchestrator/serverless.yml, actualiza las variables de entorno CUSTOMERS_API_BASE y ORDERS_API_BASE con las URLs de ngrok.

Despliega el Lambda: Desde la carpeta /lambda-orchestrator, ejecuta el script de despliegue.

npm run deploy

Al finalizar, la terminal te proporcionará la URL pública de tu Lambda en AWS. Ya puedes usar esa URL en Postman para probar el sistema en un entorno real.