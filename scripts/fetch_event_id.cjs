const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ijvbnduaecrpsaivgzay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqdmJuZHVhZWNycHNhaXZnemF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDk5MDcsImV4cCI6MjA4MTcyNTkwN30.8qFhjzkuFunEsxsYHnq5y8IgSl7K2yJIXRWrGonrcDI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchEventId() {
    const { data, error } = await supabase
        .from('events')
        .select('id, venue_lat, venue_lng, dress_code_images, gift_config')
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching event:', error);
        return;
    }

    if (data) {
        console.log(`EVENT_ID=${data.id}`);
        console.log('Event Data:', JSON.stringify(data, null, 2));
    } else {
        console.log('No events found');
    }
}

fetchEventId();
