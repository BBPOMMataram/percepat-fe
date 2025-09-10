name: Deploy Next.js

on:
  push:
    branches: ["main"]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Deploy to Server
      uses: appleboy/ssh-action@v0.1.10
      with:
        host: ${{ secrets.SSH_HOST }}
        username: ${{ secrets.SSH_USER }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /home/bbpommataram.id/NEXT-PROJECT
          git pull origin main
          npm install --production=false
          npm run build
          pm2 restart 0
