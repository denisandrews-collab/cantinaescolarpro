# Print Server

Small Node.js print server to send ESC/POS raw bytes to network thermal printers.

Usage:

1. Install dependencies:

```bash
cd server
npm install
```

2. Configure printers in `server/config/printers.json` (IP and port).

3. Start server:

```bash
npm start
# or
npm run dev
```

4. Example curl (replace localhost if server runs elsewhere):

```bash
curl -X POST http://localhost:3001/print -H "Content-Type: application/json" -d '{"printer":"counter","transaction":{"id":"1234","date":"2025-12-08T12:00:00Z","storeName":"Cantina Escolar","studentName":"Balcao","items":[{"name":"Suco de Laranja","quantity":2,"price":8.00}],"total":16.00,"aiMessage":"Obrigado!"}}'
```

PowerShell test example (raw ESC/POS):

```powershell
$ip='192.168.6.5'; $port=9100; $client=New-Object System.Net.Sockets.TcpClient; $client.Connect($ip,$port); $stream=$client.GetStream(); $bytes=[byte[]](0x1B,0x40)+([System.Text.Encoding]::ASCII.GetBytes("Teste ESC/POS`n"))+[byte[]](0x1D,0x56,0x41,0x00); $stream.Write($bytes,0,$bytes.Length); $stream.Close(); $client.Close();
```

Notes:
- This server sends basic text to the printer. You can extend `buildEscPosForTransaction` to add formatting, code pages and images if needed.
- Make sure your PC can reach the printer IP and port (no firewall/VLAN blocking).
