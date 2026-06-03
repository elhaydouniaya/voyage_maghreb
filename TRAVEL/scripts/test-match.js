(async ()=>{
  try {
    const res = await fetch('http://localhost:3003/api/ai/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: 'Marrakech', isDateFlexible: true, budgetMax: 1500, tripType: ['CULTURE'], numberOfTravelers: 2 })
    });
    const text = await res.text();
    console.log('Status', res.status);
    console.log(text);
  } catch (e) {
    console.error('Request failed:', e);
  }
})();
