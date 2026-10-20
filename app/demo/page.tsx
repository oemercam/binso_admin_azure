import {redirect} from 'next/navigation';

/** Legacy public URLs never provision or resume a demo account. */
export default function Demo(){
 redirect('/registrieren');
}
