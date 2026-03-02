
export const CHAIR_WIDTH_CM = 60; // 60cm per chair

export const calculateMaxChairsRound = (radiusInCm: number): number => {
    // Adjusted for tighter seating on round tables (approx 47cm per person to fit 10 people on 75cm radius)
    const ROUND_TABLE_CHAIR_WIDTH_CM = 47;
    const circumference = 2 * Math.PI * radiusInCm;
    return Math.floor(circumference / ROUND_TABLE_CHAIR_WIDTH_CM);
};

export const calculateMaxChairsRect = (widthInCm: number, heightInCm: number): number => {
    // Adjusted logic for rectangular tables based on user request:
    // 2m (200cm) fits 4 people -> ~50cm per person on long sides
    // 1m (100cm) fits 1 person -> ~100cm per person on short sides (head of table)

    // Side capacity = dimension / 50cm.
    let wChairs = Math.floor(widthInCm / 50);
    let hChairs = Math.floor(heightInCm / 50);

    // Correction for table heads (typically the shorter side)
    // If a side is between 70cm and 110cm, it fits exactly 1 person at the head
    if (widthInCm <= 110 && widthInCm >= 70) wChairs = 1;
    if (heightInCm <= 110 && heightInCm >= 70) hChairs = 1;

    return (wChairs * 2) + (hChairs * 2);
};

export const getUpdatedChairs = (type: 'round' | 'rect' | 'square', dimensions: { width: number; height: number; radius: number }): number => {
    if (type === 'round') {
        return calculateMaxChairsRound(dimensions.radius);
    } else {
        return calculateMaxChairsRect(dimensions.width, dimensions.height);
    }
};
