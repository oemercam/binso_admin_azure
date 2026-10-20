'use client';
import {useState,type ComponentProps} from 'react';
import {Input,Icon} from './ui';
import {LocalizedElement} from '@/lib/client/locale';

/** One password visibility control for login, setup and password recovery. */
export function PasswordInput({showLabel='Passwort anzeigen',hideLabel='Passwort ausblenden',...props}:Omit<ComponentProps<typeof Input>,'type'> & {showLabel?:string;hideLabel?:string}){
 const [visible,setVisible]=useState(false);
 return <div className="password-field"><Input {...props} type={visible?'text':'password'}/><LocalizedElement as="button" className="password-visibility" type="button" disabled={props.disabled} onClick={()=>setVisible(value=>!value)} aria-label={visible?hideLabel:showLabel} aria-pressed={visible}><Icon name={visible?'eye-off':'eye'} size={18}/></LocalizedElement></div>;
}
