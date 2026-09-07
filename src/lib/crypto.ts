import crypto from 'node:crypto';
export function sha256(value:string){return crypto.createHash('sha256').update(value).digest('hex')}
export function hmacSha256(value:string,secret:string){return crypto.createHmac('sha256',secret).update(value).digest('hex')}
export function safeEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y)}
export function randomId(prefix='id'){return `${prefix}_${crypto.randomBytes(12).toString('hex')}`}
