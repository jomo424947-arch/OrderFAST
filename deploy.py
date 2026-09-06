import sys
import paramiko

def deploy():
    sys.stdout.reconfigure(encoding='utf-8')
    print("🚀 Connecting to VPS (148.66.152.6)...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect('148.66.152.6', username='speedmark', password='@Black232006', timeout=20)
        print("✓ Connected successfully.")
        
        cmd = "cd /home/speedmark/cyber-project && git pull origin main && npm run build && pm2 restart cyber-server"
        print(f"📦 Executing on server: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        
        if out:
            print(out)
        if err:
            print("Server warnings/stderr:")
            print(err)
            
        print("🎉 Deployment to VPS completed successfully!")
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        sys.exit(1)
    finally:
        client.close()

if __name__ == '__main__':
    deploy()
