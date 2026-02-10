import React from 'react';
import PlaceCard from './PlaceCard';
import { Place } from '@/types';

interface PlaceGridProps {
    places: Place[];
    onSelectPlace: (place: Place) => void;
    isLoading?: boolean;
    selectedIds: Set<string>;
    onToggleSelect: (placeId: string) => void;
    onEnrichPlace?: (place: Place) => Promise<void>;
}

const PlaceGrid: React.FC<PlaceGridProps> = ({
    places,
    onSelectPlace,
    isLoading,
    selectedIds,
    onToggleSelect,
    onEnrichPlace
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-2xl h-80 animate-pulse border border-white/10" />
                ))}
            </div>
        );
    }

    if (!places || places.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 pb-20">
            {places.map((place, index) => {
                const id = place.place_id || `place-${index}`;
                return (
                    <PlaceCard
                        key={id}
                        place={place}
                        onSelect={onSelectPlace}
                        isSelected={id ? selectedIds.has(id) : false}
                        onToggleSelect={onToggleSelect}
                        selectable={true}
                        rankIndex={index}
                    />
                );
            })}
        </div>
    );
};

export default PlaceGrid;
