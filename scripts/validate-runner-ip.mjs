import {isIP} from 'node:net';
const ip=process.argv[2];
const parts=String(ip).split('.').map(Number);
if(isIP(ip)!==4||parts[0]===0||parts[0]===10||parts[0]===127||parts[0]>=224||parts[0]===169&&parts[1]===254||parts[0]===192&&parts[1]===168||parts[0]===172&&parts[1]>=16&&parts[1]<=31||parts[0]===100&&parts[1]>=64&&parts[1]<=127)throw Error('Expected one explicit public IPv4 address; never an Azure-wide rule');
