<template>
	<div>
		<FilePicker name="Pick some files" :buttons="buttons" />
	</div>
</template>

<script>
import { FilePickerVue as FilePicker } from '@nextcloud/dialogs/filepicker.js'
import InternalIcon from 'vue-material-design-icons/OpenInNew.vue'
export default {
	name: 'Clipboard',
	components: {
		FilePicker,
	},
	data() {
		return {
			buttons: [{
				label: 'Pick',
				callback: (nodes) => console.log('Picked', nodes),
				type: 'primary'
			},
			{
				label: 'Share',
				callback: (nodes) => console.log('Share picked files', nodes),
				type: 'secondary',
				icon: InternalIcon,
			}]
		}
	}
}
</script>
