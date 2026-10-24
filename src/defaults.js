const old_youtube_storage_key = 'old_youtube_settings';

const old_youtube_defaults = Object.freeze( {
    classic_player: true,
    classic_layout: true,
    classic_details: true,
    no_ambient: true
} );

const old_youtube_read_cache = ( ) => {
    try {
        const cached = JSON.parse( localStorage.getItem( old_youtube_storage_key ) || '{}' );
        const known = Object.keys( old_youtube_defaults ).filter( ( key ) => key in cached );

        return { ...old_youtube_defaults, ...Object.fromEntries( known.map( ( key ) => [ key, Boolean( cached[ key ] ) ] ) ) };
    } catch ( error ) {
        return { ...old_youtube_defaults };
    }
};
