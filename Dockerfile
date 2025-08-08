FROM nginx:alpine

# Copia todos os arquivos do frontend (como index.html, css/, js/, etc)
COPY . /usr/share/nginx/html/

# Substitui a configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
