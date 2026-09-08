'use client';
import {useEffect,useState} from 'react';
import RecommendationRail from '@/components/RecommendationRail';
export default function PersonalizedRecommendations(){const[ids,setIds]=useState<string[]>([]);useEffect(()=>{try{setIds(JSON.parse(localStorage.getItem('priyasa_recently_viewed')||'[]').slice(0,6))}catch{}},[]);if(!ids.length)return null;return <RecommendationRail seedIds={ids} title="Picked for you" eyebrow="YOUR PRIYASA PICKS" subtitle="Styles selected from what you've been exploring." limit={8} excludeIds={ids}/>}
