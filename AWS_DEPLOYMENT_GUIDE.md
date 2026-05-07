# 🚀 Guía Maestra: Despliegue de ChefCo2 en AWS (Paso a Paso)

¡Hola! Esta guía está diseñada para que subas tu proyecto a AWS de la forma más profesional posible para tu presentación de clase. Usaremos una **instancia EC2** y **Docker Compose**, que es el estándar de la industria.

---

## 🛠️ Lo que necesitas antes de empezar
1. **Tu cuenta de AWS de estudiante** (AWS Academy o Educate).
2. **Tu código subido a GitHub** (Es la forma más fácil de pasarlo al servidor).
3. **Un terminal** (PowerShell, CMD, Git Bash o el propio VS Code).

---

## 📍 FASE 1: Crear el Servidor en AWS (Instancia EC2)

1.  **Entra en AWS Console** y busca el servicio **EC2**.
2.  Haz clic en **"Launch Instance"** (Lanzar instancia).
3.  **Nombre:** Ponle `ChefCo2-Server`.
4.  **Sistema Operativo (AMI):** Elige **Ubuntu 22.04 LTS** (es el más estable y compatible).
5.  **Tipo de instancia:** Asegúrate de que diga **t2.micro** (es la de la capa gratuita/Free Tier).
6.  **Key Pair (Clave):** Haz clic en "Create new key pair". Ponle nombre `chef-key`, descárgala (`.pem`) y **guárdala muy bien**, ¡sin ella no podrás entrar al servidor!
7.  **Network Settings (Firewall):**
    *   Marca "Allow SSH traffic from anywhere" (Puerto 22).
    *   Marca "Allow HTTPS traffic from the internet" (Puerto 443).
    *   Marca "Allow HTTP traffic from the internet" (Puerto 80).
8.  Haz clic en **"Launch Instance"**. ¡Ya tienes tu ordenador en la nube!

---

## 📍 FASE 2: Conectar con tu Servidor

1.  En el panel de EC2, busca tu instancia y copia su **Public IPv4 Address** (ej: `54.12.34.56`).
2.  Abre una terminal en tu ordenador (donde descargaste la clave `.pem`).
3.  Ejecuta este comando (cambia `chef-key.pem` por tu archivo y la IP por la tuya):
    ```bash
    ssh -i "chef-key.pem" ubuntu@tu-ip-de-aws
    ```
    *(Si te pregunta algo de "authenticity", escribe `yes`)*.

---

## 📍 FASE 3: Preparar el Servidor (Instalar Docker)

Una vez dentro de la pantalla negra de tu servidor de AWS, pega estos comandos uno a uno:

1.  **Actualizar el sistema:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
2.  **Instalar Docker:**
    ```bash
    sudo apt install docker.io -y
    sudo systemctl start docker
    sudo systemctl enable docker
    ```
3.  **Instalar Docker Compose:**
    ```bash
    sudo apt install docker-compose -y
    ```
4.  **Dar permisos:**
    ```bash
    sudo usermod -aG docker ubuntu
    ```
    *(Cierra la sesión con `exit` y vuelve a entrar con el comando `ssh` del paso anterior para que los permisos se activen)*.

---

## 📍 FASE 4: Subir tu Código y Configurar

1.  **Clona tu proyecto:**
    ```bash
    git clone https://github.com/tu-usuario/tu-repositorio.git
    cd tu-repositorio
    ```
2.  **Configura las variables de entorno:**
    Necesitamos que el Frontend sepa hablar con la IP de AWS.
    *   Crea un archivo `.env` en la raíz (o dentro de backend/frontend según tus Dockerfiles):
    ```bash
    nano .env
    ```
    *   Pega tus variables (Database URL, Secret Keys, etc.).
    *   **IMPORTANTE:** Asegúrate de que en el Frontend, la variable de la API apunte a la IP de tu servidor AWS (ej: `VITE_API_URL=http://tu-ip-aws:5000/api`).

---

## 📍 FASE 5: ¡Lanzar la Aplicación! 🚀

Este es el paso mágico que dejará a tus profesores impresionados. Solo tienes que ejecutar:

```bash
docker-compose up -d --build
```

**¿Qué hace esto?**
*   Construye las imágenes de tu Backend y Frontend.
*   Configura la red entre ellos.
*   Levanta todo en segundo plano (`-d`).

---

## 📍 FASE 6: Verificación Final

1.  Ve a tu navegador y escribe la IP de tu servidor AWS.
2.  Si configuramos Nginx correctamente en el Docker de Frontend (puerto 80), ¡deberías ver tu web funcionando!
3.  **Puertos:** Si tu API corre en el 5000, recuerda ir a la pestaña **"Security" -> "Security Groups"** en AWS y añadir una regla de entrada (Inbound Rule) para permitir el puerto **5000**.

---

## 💡 Consejos para la Presentación
*   **Dilo así:** "He desplegado la aplicación usando **Docker Compose** en una instancia **Amazon EC2**. Esto me permite asegurar la portabilidad y escalabilidad del proyecto, garantizando que el entorno de producción sea idéntico al de desarrollo."
*   Muestra el terminal de AWS funcionando si te preguntan por el despliegue.

¡Mucha suerte! Si te quedas trabada en algún paso de la terminal de AWS, dímelo y lo solucionamos. 🍀