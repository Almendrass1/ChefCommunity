# Utilizar una imagen oficial de Python ligera
FROM python:3.10-slim

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar el archivo de dependencias primero (aprovecha la caché de Docker)
COPY requirements.txt .

# Instalar las dependencias y el servidor de producción Gunicorn
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copiar el resto del código del backend
COPY . .

# Exponer el puerto donde correrá el backend
EXPOSE 5000

# Comando para iniciar la aplicación con Gunicorn (servidor de producción)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "3", "app:app"]
