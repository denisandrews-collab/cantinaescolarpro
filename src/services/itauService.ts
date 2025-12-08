// Simulação do Serviço de Integração Itaú
// Em produção, isso chamaria endpoints como https://oauth.itau.com.br e https://secure.api.itau/pix_recebimentos

export interface PixChargeResponse {
    txid: string;
    pixCopiaCola: string;
    qrCodeImage: string; // Base64 ou URL
    status: 'PENDING' | 'PAID';
}

export const createPixCharge = async (amount: number, description: string, pixKey: string): Promise<PixChargeResponse> => {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Gera um Payload Pix estático (apenas para exemplo visual)
    const amountStr = amount.toFixed(2).replace('.', '');
    const fakePayload = `00020126580014br.gov.bcb.pix0136${pixKey}520400005303986540${amountStr}5802BR5913CANTINA ESCOLAR6008SAO PAULO62070503***6304`;

    // API de QR Code pública para gerar a imagem visualmente
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fakePayload)}`;

    return {
        txid: `itau-${Date.now()}`,
        pixCopiaCola: fakePayload,
        qrCodeImage: qrCodeUrl,
        status: 'PENDING'
    };
};

export const checkPixStatus = async (txid: string): Promise<'PENDING' | 'PAID'> => {
    // Simula checagem de status
    return Math.random() > 0.7 ? 'PAID' : 'PENDING';
};