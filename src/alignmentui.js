/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module alignment/alignmentui
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import { createDropdown, addToolbarToDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';

import { commandNameFromOptionName } from './alignmentcommand';
import { isSupported } from './alignmentediting';

import alignLeftIcon from '../theme/icons/align-left.svg';
import alignRightIcon from '../theme/icons/align-right.svg';
import alignCenterIcon from '../theme/icons/align-center.svg';
import alignJustifyIcon from '../theme/icons/align-justify.svg';

const icons = new Map( [
	[ 'left', alignLeftIcon ],
	[ 'right', alignRightIcon ],
	[ 'center', alignCenterIcon ],
	[ 'justify', alignJustifyIcon ]
] );

/**
 * The default alignment UI plugin.
 *
 * It introduces the `'alignLeft'`, `'alignRight'`, `'alignCenter'` and `'alignJustify'` buttons
 * and the `'alignmentDropdown'` drop-down.
 *
 * @extends module:core/plugin~Plugin
 */
export default class AlignmentUI extends Plugin {
	/**
	 * Returns the localized option titles provided by the plugin.
	 *
	 * The following localized titles corresponding with
	 * {@link module:alignment/alignment~AlignmentConfig#options} are available:
	 *
	 * * `'left'`,
	 * * `'right'`,
	 * * `'center'`,
	 * * `'justify'`.
	 *
	 * @readonly
	 * @type {Object.<String,String>}
	 */
	get localizedOptionTitles() {
		const t = this.editor.t;

		return {
			'left': t( 'Align left' ),
			'right': t( 'Align right' ),
			'center': t( 'Align center' ),
			'justify': t( 'Justify' )
		};
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'AlignmentUI';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const componentFactory = editor.ui.componentFactory;
		const t = editor.t;
		const options = editor.config.get( 'alignment.options' );

		options
			.filter( isSupported )
			.forEach( option => this._addButton( option ) );

		componentFactory.add( 'alignmentDropdown', locale => {
			const dropdownView = createDropdown( locale );

			// Add existing alignment buttons to dropdown's toolbar.
			const buttons = options.map( option => componentFactory.create( commandNameFromOptionName( option ) ) );
			addToolbarToDropdown( dropdownView, buttons );

			// Configure dropdown properties an behavior.
			dropdownView.buttonView.set( {
				label: t( 'Text alignment' ),
				tooltip: true
			} );

			dropdownView.toolbarView.isVertical = true;

			dropdownView.extendTemplate( {
				attributes: {
					class: 'ck-alignment-dropdown'
				}
			} );

			// The default icon is align left as we do not support RTL yet (see #3).
			const defaultIcon = alignLeftIcon;

			// Change icon to reflect current selection's alignment.
			dropdownView.buttonView.bind( 'icon' ).toMany( buttons, 'isOn', ( ...areActive ) => {
				// Get the index of an active button.
				const index = areActive.findIndex( value => value );

				// If none of the commands is active, display either defaultIcon or the first button's icon.
				if ( index < 0 ) {
					return defaultIcon;
				}

				// Return active button's icon.
				return buttons[ index ].icon;
			} );

			// Enable button if any of the buttons is enabled.
			dropdownView.bind( 'isEnabled' ).toMany( buttons, 'isEnabled', ( ...areEnabled ) => areEnabled.some( isEnabled => isEnabled ) );

			return dropdownView;
		} );
	}

	/**
	 * Helper method for initializing the button and linking it with an appropriate command.
	 *
	 * @private
	 * @param {String} option The name of the alignment option for which the button is added.
	 */
	_addButton( option ) {
		const editor = this.editor;

		const commandName = commandNameFromOptionName( option );

		editor.ui.componentFactory.add( commandName, locale => {
			const command = editor.commands.get( commandName );
			const buttonView = new ButtonView( locale );

			buttonView.set( {
				label: this.localizedOptionTitles[ option ],
				icon: icons.get( option ),
				tooltip: true
			} );

			// Bind button model to command.
			buttonView.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

			// Execute command.
			this.listenTo( buttonView, 'execute', () => {
				editor.execute( commandName );
				editor.editing.view.focus();
			} );

			return buttonView;
		} );
	}
}
