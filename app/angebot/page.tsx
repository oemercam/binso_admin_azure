import {PublicOffer} from '@/components/public-offer';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Angebot',robots:{index:false,follow:false},referrer:'no-referrer'};
export default function OfferPage(){return <PublicOffer/>;}
