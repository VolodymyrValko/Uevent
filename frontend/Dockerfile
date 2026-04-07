FROM node:20-alpine AS builder

ARG REACT_APP_API_URL=http://localhost:5000
ARG REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
ARG REACT_APP_GOOGLE_CLIENT_ID=placeholder

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_STRIPE_PUBLISHABLE_KEY=$REACT_APP_STRIPE_PUBLISHABLE_KEY
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID

# Increase Node memory for large React builds
ENV NODE_OPTIONS=--max_old_space_size=2048

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM nginx:1.25-alpine AS production

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
