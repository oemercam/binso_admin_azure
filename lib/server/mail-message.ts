import 'server-only';
import MailComposer from 'nodemailer/lib/mail-composer';
export type Mail={to:string;subject:string;html:string;text:string;attachments?:Array<{name:string;contentType:string;content:Buffer}>};
const singleAddress=(value:string)=>/^[^\s<>,;"@]+@[^\s<>,;"@]+\.[^\s<>,;"@]+$/u.test(value);
/** Rendering only: never creates a transport or opens a network connection. */
export async function renderMailMessage(mail:Mail,sender:string){
 if(!singleAddress(sender)||!singleAddress(mail.to)||/[\r\n]/.test(mail.subject))throw new Error('Invalid mail envelope');
 if(!mail.text.trim()||!mail.html.trim())throw new Error('Plain text and HTML are required');
 if(mail.attachments?.some(item=>!Buffer.isBuffer(item.content)||/[\r\n]/.test(item.name)||/[\r\n]/.test(item.contentType)))throw new Error('Invalid in-memory attachment');
 return new MailComposer({
  from:{name:'Binso One',address:sender},to:{address:mail.to},subject:mail.subject,
  text:mail.text,html:mail.html,disableFileAccess:true,disableUrlAccess:true,
  newline:'\r\n',textEncoding:'base64',
  attachments:mail.attachments?.map(item=>({filename:item.name,contentType:item.contentType,content:item.content})),
 }).compile().build();
}
