const setting_rows = [
    {
        key: 'classic_player',
        title: 'Classic player controls',
        detail: 'Flat control bar, no pills or hover circles'
    },
    {
        key: 'classic_layout',
        title: 'Classic layout',
        detail: 'Description and comments under the video'
    },
    {
        key: 'classic_details',
        title: 'Classic details',
        detail: 'No hover blobs, no colorful description'
    },
    {
        key: 'no_ambient',
        title: 'Disable ambient mode',
        detail: 'No glow behind the player'
    }
];

const settings_card = document.getElementById( 'settings' );
const row_template = document.getElementById( 'row_template' );
const reload_bar = document.getElementById( 'reload_bar' );
const reload_button = document.getElementById( 'reload_button' );

const build_row = ( row, settings ) => {
    const fragment = row_template.content.cloneNode( true );
    const input = fragment.querySelector( '.toggle_input' );

    fragment.querySelector( '.row_title' ).textContent = row.title;
    fragment.querySelector( '.row_detail' ).textContent = row.detail;

    input.checked = Boolean( settings[ row.key ] );

    input.addEventListener( 'change', async ( ) => {
        await chrome.storage.sync.set( { [ row.key ]: input.checked } );

        reload_bar.hidden = false;
    } );

    return fragment;
};

const reload_youtube_tabs = async ( ) => {
    const tabs = await chrome.tabs.query( { url: '*://www.youtube.com/*' } );

    await Promise.all( tabs.map( ( tab ) => chrome.tabs.reload( tab.id ) ) );

    window.close( );
};

const render_settings = async ( ) => {
    const stored = await chrome.storage.sync.get( old_youtube_defaults );
    const settings = { ...old_youtube_defaults, ...stored };

    settings_card.replaceChildren( ...setting_rows.map( ( row ) => build_row( row, settings ) ) );
};

reload_button.addEventListener( 'click', reload_youtube_tabs );

render_settings( );
