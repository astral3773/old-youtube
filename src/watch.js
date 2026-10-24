const watch_root = document.documentElement;

let watch_frame = 0;

const keep_comments_below = ( ) => {
    watch_frame = 0;

    if ( location.pathname !== '/watch' || !watch_root.classList.contains( 'old_youtube_classic_layout' ) ) {
        return;
    }

    const comments = document.querySelector( 'ytd-comments#comments' );
    const below = document.querySelector( 'ytd-watch-flexy #below' );

    if ( comments && below && !below.contains( comments ) ) {
        below.appendChild( comments );
    }
};

const schedule_check = ( ) => {
    if ( !watch_frame ) {
        watch_frame = requestAnimationFrame( keep_comments_below );
    }
};

for ( const event_name of [ 'yt-navigate-finish', 'yt-page-data-updated' ] ) {
    document.addEventListener( event_name, schedule_check );
}

document.addEventListener( 'DOMContentLoaded', schedule_check, { once: true } );
