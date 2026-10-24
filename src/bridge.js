const bridge_root = document.documentElement;

let bridge_settings = old_youtube_read_cache( );

const apply_setting_classes = ( ) => {
    for ( const [ name, enabled ] of Object.entries( bridge_settings ) ) {
        const class_name = `old_youtube_${ name }`;

        if ( bridge_root.classList.contains( class_name ) !== Boolean( enabled ) ) {
            bridge_root.classList.toggle( class_name, Boolean( enabled ) );
        }
    }
};

const write_setting_cache = ( ) => {
    try {
        localStorage.setItem( old_youtube_storage_key, JSON.stringify( bridge_settings ) );
    } catch ( error ) {
        return;
    }
};

const sync_settings = async ( ) => {
    const stored = await chrome.storage.sync.get( old_youtube_defaults );

    bridge_settings = { ...old_youtube_defaults, ...stored };

    apply_setting_classes( );
    write_setting_cache( );
};

apply_setting_classes( );
sync_settings( );

chrome.storage.onChanged.addListener( ( changes, area ) => {
    if ( area === 'sync' ) {
        sync_settings( );
    }
} );

new MutationObserver( apply_setting_classes ).observe( bridge_root, {
    attributes: true,
    attributeFilter: [ 'class' ]
} );
