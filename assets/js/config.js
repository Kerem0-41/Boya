// Backend (Cloudflare Worker) adresi.
// Yayına alınca aşağıdaki CANLI_API adresini kendi Worker adresinle değiştir.
const CANLI_API = "https://boyaci.HESAP-ADI.workers.dev";

// Bilgisayarda test ederken (BASLAT.bat) backend aynı adresten çalışır
const yerel = ["localhost", "127.0.0.1"].includes(location.hostname) || location.hostname.endsWith(".workers.dev");

export const API_URL = yerel ? "" : CANLI_API;
