'use client';
import {usePathname} from 'next/navigation';
import CartRecommendations from '@/components/CartRecommendations';
export default function StorefrontCartExtras(){const pathname=usePathname();return pathname==='/cart'||pathname==='/checkout'?<CartRecommendations/>:null}
