import Vue from 'vue'
import './bootstrap.js'
import PermissionsModal from './PermissionsModal.vue'

import { generateOcsUrl, generateUrl } from '@nextcloud/router'
import { dirname } from '@nextcloud/paths'
import { showError } from '@nextcloud/dialogs'
import axios from '@nextcloud/axios'
import moment from '@nextcloud/moment'
import '../css/main.scss'

let permVue
let lastPath = null
let webexApp
if (window.Webex?.Application) {
	webexApp = new window.Webex.Application()
	webexApp.onReady().then(() => {
		console.debug('[picker main] host app is ready', webexApp)
		// log('onReady()', { message: 'host app is ready' })
		/*
		webexApp.listen().then(() => {
			app.on('application:displayContextChanged', (payload) => log('application:displayContextChanged', payload));
			app.on('application:shareStateChanged', (payload) => log('application:shareStateChanged', payload));
			app.on('application:themeChanged', (payload) => log('application:themeChanged', payload));
			app.on('meeting:infoChanged', (payload) => log('meeting:infoChanged', payload));
			app.on('meeting:roleChanged', (payload) => log('meeting:roleChanged', payload));
			app.on('space:infoChanged', (payload) => log('space:infoChanged', payload));
		})
		*/
	})
	console.debug('[picker main] Yes we are in a webex app', webexApp)
} else {
	console.debug('[picker main] No webex app')
}

function editShare(shareId, permission, action) {
	console.debug('action is', action)
	const url = generateOcsUrl('/apps/files_sharing/api/v1/shares/{shareId}', { shareId })
	const req = {
		permissions: permission === 'write' ? 3 : undefined,
		expireDate: '',
	}
	axios.put(url, req).then((response) => {
		console.debug('[picker main] edit share link success', response.data?.ocs?.data)
		const publicLinkUrl = response.data?.ocs?.data?.url
		if (webexApp) {
			console.debug('[picker main] after edit, there is a webex app => setShareUrl')
			// const token = response.data?.ocs?.data?.token
			// const fileId = response.data?.ocs?.data?.file_source
			// const urlForWebex = generateUrl('/apps/picker/webex-share/{token}?fileId={fileId}', { token, fileId })
			// webexApp.setShareUrl(urlForWebex, urlForWebex, t('picker', 'Nextcloud picker')).then(() => {
			webexApp.setShareUrl(publicLinkUrl, publicLinkUrl, t('picker', 'Nextcloud picker')).then(() => {
				console.debug('[picker main] setShareUrl.then => change location to', publicLinkUrl)
				window.location = publicLinkUrl
			}).catch((error) => {
				console.error(error)
			})
		} else if (action === 'open') {
			console.debug('[picker main] after edit, there is NO webex app => setShareUrl')
			window.location = publicLinkUrl
		} else {
			console.debug('[picker main] after edit, there is NO webex app => copyShareLink')
			navigator.clipboard.writeText(publicLinkUrl)
			// const sendDataButton = document.getElementById('sendDataButton')
			// const pickerData = 'Picker can be closed'
			// sendDataButton.addEventListener('click', () => {
			// Send the data to the parent window
			// const url = generateOcsUrl('/apps/picker/single-link')
			// console.debug('[picker main] url is ', url)
			// window.opener.postMessage('Picker can be closed', '/nextcloud/apps/picker/single-link')
			// });
			// this.open = false
			// window.opener.location.reload()
			// window.close()
			// opener.close.value = 'closing'
			// opener.postMessage('closing')
			// openFilePicker()
			// window.returnValue = true
			// const by_window = window.open('', '_blank')
			// setTimeout(function(){ by_window.close() }, 5000)
			// return false
			// window.location = publicLinkUrl
		}
	}).catch((error) => {
		console.debug(error)
		showError(t('picker', 'Error while editing the shared access'))
	})
}

function createPublicLink(path, permission, action) {
	const url = generateOcsUrl('/apps/files_sharing/api/v1/shares')
	const req = {
		path,
		shareType: 3,
		label: '[P] ' + t('picker', 'Picker link') + ' ' + moment().format('YYYY-MM-DD HH:mm:ss'),
	}
	axios.post(url, req).then((response) => {
		console.debug('ADD SUCCESS', response.data?.ocs?.data, action, permission)
		const shareId = response.data?.ocs?.data?.id
		editShare(shareId, permission, action)
	}).catch((error) => {
		console.error(error)
		showError(t('picker', 'Error while creating the shared access'))
	})
}

function onFileSelected(targetPath) {
	const url = generateUrl('/apps/picker/can-share?path={targetPath}', { targetPath })
	axios.get(url).then((response) => {
		if (response.data.allowed) {
			// createPublicLink(targetPath)
			permVue.setFilePath(targetPath)
			permVue.setOpen(true)
			lastPath = dirname(targetPath)
		} else {
			showError(t('picker', 'You are not allowed to share this file'))
			setTimeout(openFilePicker, 500)
		}
	}).catch((error) => {
		console.error(error)
		showError(t('picker', 'Error while checking if you are allowed to share this file'))
	})
}

function openFilePicker() {
	OC.dialogs.filepicker(
		t('picker', 'Choose a file and start collaborating'),
		(targetPath) => {
			onFileSelected(targetPath)
		},
		false, null, true, undefined, lastPath
	)
}

document.addEventListener('DOMContentLoaded', (event) => {
	const View = Vue.extend(PermissionsModal)
	permVue = new View().$mount('#picker')
	permVue.$on('closed', () => {
		openFilePicker()
	})

	permVue.$on('open', (filePath, permission) => {
		createPublicLink(filePath, permission, 'open')
	})

	permVue.$on('copy', (filePath, permission) => {
		createPublicLink(filePath, permission, 'copy')
	})

	openFilePicker()
})
