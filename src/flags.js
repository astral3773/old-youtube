( ( ) => {
    const root_classes = document.documentElement.classList;
    const has_classes = [ ...root_classes ].some( ( class_name ) => class_name.startsWith( 'old_youtube_' ) );

    const cached_settings = ( ( ) => {
        try {
            return JSON.parse( localStorage.getItem( 'old_youtube_settings' ) || 'null' );
        } catch ( error ) {
            return null;
        }
    } )( );

    const is_enabled = ( name ) => {
        if ( has_classes || !cached_settings ) {
            return root_classes.contains( `old_youtube_${ name }` );
        }

        return Boolean( cached_settings[ name ] );
    };

    const flag_groups = {
        no_ambient: {
            experiment: {
                kevlar_watch_cinematics: false,
                web_cinematic_watch_settings: false,
                web_cinematic_theater_mode: false,
                web_cinematic_fullscreen: false,
                web_cinematic_masthead: false,
                web_watch_cinematics_preferred_reduced_motion_default_disabled: false,
                cinematic_watch_effect_opacity: 0,
                cinematic_watch_effect_letterbox_opacity: 0
            },
            player: {
                web_player_use_cinematic_label_2: false
            }
        },
        classic_player: {
            experiment: {
                delhi_modern_web_player_icons: false,
                delhi_modern_web_player_compact_video_actions_controls: false,
                delhi_web_player_use_external_playlist_panel: false,
                enable_web_delhi_icons: false
            },
            player: {
                delhi_modern_web_player: false,
                delhi_modern_web_player_icons: false,
                delhi_modern_web_player_horizontal_volume_controls: false,
                delhi_modern_web_player_lhs_volume_controls: false,
                delhi_fast_follow_autonav_toggle: false,
                delhi_web_player_use_external_playlist_panel: false,
                enable_web_delhi_icons: false,
                enable_modern_skip_button_on_web: false,
                web_player_delhi_dtts: false
            }
        },
        classic_layout: {
            experiment: {
                disable_theater_mode: false,
                enable_web_side_rail: false,
                kevlar_watch_grid: false,
                web_ablate_stuff_under_player: false,
                web_dismissible_panels_expanded_wn: false,
                web_dismissible_panels_theater_state_fix: false,
                web_fixed_panel_watch_next_grid_swap: false,
                web_live_chat_panel_watch_next_grid_swap: false,
                web_side_rail_dismissible_panels: false,
                web_side_rail_hide_youchat_action_button: false,
                web_side_rail_number_shortcuts: false,
                web_watch_compressed_lockup_metadata: false,
                web_watch_fixed_default_panels: false,
                web_watch_split_scroll: false,
                kevlar_watch_below_centered_player_height: 136,
                kevlar_watch_flexy_metadata_height: 48,
                kevlar_watch_max_player_width: 2080,
                kevlar_watch_secondary_max_width: 800
            }
        },
        classic_details: {
            experiment: {
                web_delhi_colorful_sd: false,
                web_watch_rounded_player_large: false
            }
        }
    };

    const collect_overrides = ( kind ) => {
        const overrides = { };

        for ( const [ name, group ] of Object.entries( flag_groups ) ) {
            if ( is_enabled( name ) && group[ kind ] ) {
                Object.assign( overrides, group[ kind ] );
            }
        }

        return overrides;
    };

    const experiment_overrides = collect_overrides( 'experiment' );
    const player_overrides = collect_overrides( 'player' );
    const has_player_overrides = Object.keys( player_overrides ).length > 0;
    const patched_contexts = new WeakMap( );

    const split_pair = ( pair ) => {
        const index = pair.indexOf( '=' );

        return index < 0 ? [ pair, null ] : [ pair.slice( 0, index ), pair.slice( index + 1 ) ];
    };

    const join_pair = ( [ name, value ] ) => ( value === null ? name : `${ name }=${ value }` );

    const patch_serialized_flags = ( serialized ) => {
        const pairs = new Map( serialized.split( '&' ).filter( Boolean ).map( split_pair ) );

        for ( const [ name, value ] of Object.entries( player_overrides ) ) {
            pairs.set( name, String( value ) );
        }

        return [ ...pairs ].map( join_pair ).join( '&' );
    };

    const patch_player_contexts = ( contexts ) => {
        if ( !has_player_overrides || !contexts || typeof contexts !== 'object' ) {
            return;
        }

        for ( const context of Object.values( contexts ) ) {
            const serialized = context?.serializedExperimentFlags;

            if ( typeof serialized !== 'string' || patched_contexts.get( context ) === serialized ) {
                continue;
            }

            context.serializedExperimentFlags = patch_serialized_flags( serialized );
            patched_contexts.set( context, context.serializedExperimentFlags );
        }
    };

    const pinned_flags = new WeakSet( );
    const guarded_configs = new WeakSet( );

    const pin_flags = ( flags ) => {
        if ( !flags || typeof flags !== 'object' || pinned_flags.has( flags ) ) {
            return;
        }

        pinned_flags.add( flags );

        for ( const [ name, value ] of Object.entries( experiment_overrides ) ) {
            try {
                Object.defineProperty( flags, name, {
                    configurable: true,
                    enumerable: true,
                    get: ( ) => value,
                    set: ( ) => { }
                } );
            } catch ( error ) {
                continue;
            }
        }
    };

    const guard_config = ( config ) => {
        if ( guarded_configs.has( config ) ) {
            return;
        }

        guarded_configs.add( config );

        let flags = config.EXPERIMENT_FLAGS;

        pin_flags( flags );

        try {
            Object.defineProperty( config, 'EXPERIMENT_FLAGS', {
                configurable: true,
                enumerable: true,
                get: ( ) => flags,
                set: ( value ) => {
                    flags = value;
                    pin_flags( value );
                }
            } );
        } catch ( error ) {
            return;
        }
    };

    const patch_config = ( config ) => {
        if ( !config || typeof config !== 'object' ) {
            return;
        }

        guard_config( config );
        pin_flags( config.EXPERIMENT_FLAGS );
        patch_player_contexts( config.WEB_PLAYER_CONTEXT_CONFIGS );
    };

    const read_config = ( ytcfg ) => {
        if ( typeof ytcfg?.d === 'function' ) {
            return ytcfg.d( );
        }

        return window.yt?.config_ || ytcfg?.data_;
    };

    const safe_patch = ( ytcfg ) => {
        try {
            patch_config( read_config( ytcfg ) );
        } catch ( error ) {
            return;
        }
    };

    const wrapped_configs = new WeakSet( );

    const wrap_ytcfg = ( ytcfg ) => {
        if ( !ytcfg || typeof ytcfg !== 'object' || wrapped_configs.has( ytcfg ) ) {
            return;
        }

        wrapped_configs.add( ytcfg );

        let original_set = ytcfg.set;

        const patched_set = function ( ...args ) {
            const result = original_set?.apply( this, args );

            safe_patch( ytcfg );

            return result;
        };

        Object.defineProperty( ytcfg, 'set', {
            configurable: true,
            enumerable: true,
            get: ( ) => patched_set,
            set: ( value ) => {
                original_set = value;
            }
        } );
    };

    let current_ytcfg = window.ytcfg;

    wrap_ytcfg( current_ytcfg );

    try {
        Object.defineProperty( window, 'ytcfg', {
            configurable: true,
            enumerable: true,
            get: ( ) => current_ytcfg,
            set: ( value ) => {
                current_ytcfg = value;
                wrap_ytcfg( value );
            }
        } );
    } catch ( error ) {
        safe_patch( window.ytcfg );
    }

    const late_patch = ( ) => safe_patch( window.ytcfg );

    document.addEventListener( 'DOMContentLoaded', late_patch, { once: true } );
    window.addEventListener( 'yt-navigate-start', late_patch );
} )( );
