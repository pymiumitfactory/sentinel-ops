import React, { useMemo } from 'react';
import type { Asset } from '../types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPinIcon as LocationIcon } from './Icons';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface FleetMapProps {
    assets: Asset[];
}

export const FleetMap: React.FC<FleetMapProps> = ({ assets }) => {
    // Filter assets with valid location string "lat,lng"
    const validAssets = useMemo(() => {
        return assets.filter(a => a.location && a.location.includes(',')).map(a => {
            const [lat, lng] = a.location!.split(',').map(Number);
            return { ...a, pos: [lat, lng] as [number, number] };
        });
    }, [assets]);

    if (validAssets.length === 0) {
        return (
            <div style={{
                padding: '2rem', textAlign: 'center', background: '#161b22',
                borderRadius: '8px', color: 'var(--text-secondary)'
            }}>
                <LocationIcon size={32} />
                <p>No hay activos geolocalizados para mostrar en el mapa.</p>
            </div>
        );
    }

    // Centering logic: average position or first asset
    const center: [number, number] = validAssets.length > 0 ? validAssets[0].pos : [0, 0];

    return (
        <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {validAssets.map(asset => (
                    <Marker key={asset.id} position={asset.pos}>
                        <Popup>
                            <div style={{ color: 'black' }}>
                                <strong>{asset.name}</strong><br />
                                <span style={{
                                    textTransform: 'capitalize',
                                    color: asset.status === 'active' ? 'green' : (asset.status === 'offline' ? 'gray' : 'orange')
                                }}>
                                    {asset.status}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};
