import { pounchDb } from 'libcolla'
import { CollaUtil } from 'libcolla'

class ConferenceComponent {
	constructor() {
		this.tableName = 'conference'
		pounchDb.create(this.tableName, ['peerId', 'conferenceId'])
		this.defaultConference = {
			_id: null,
			peerId: null, // 发起人
			conferenceId: null, // 会议编号
			password: '', // 密码
			linkman: false, // 是否好友才能参加
			contact: false, // 是否在地址本才能参加
			startDate: null, // 开始时间
			endDate: null, // 结束时间
			notification: true, // 自动发送会议通知
			mute: false, // 自动静音
			video: true, // 是否视频
			wait: true, // 自动等待
			advance: true, // 参会者可提前加入
			number: 300, // 参会人数上限
			attach: {}, // 会议资料
			participation: {} // 参与人的集合
		}
	}

	getDefaultConference() {
		return this.defaultConference
	}

	/**
	 * 根据传入的会议参数开始会议
	 * @param {*} conference 
	 */
	create(conference) {
		let peerId = ''
		let conferenceId = ''
		let startDate = new Date()
		let endDate = new Date()
		if (conference) {

		} else {
			conference = CollaUtil.clone(this.defaultConference)
		}
		conference = pounchDb.insert(this.tableName, conference)

		return conference
	}

	/**
	 * 加入会议
	 * @param {*} peerId 
	 * @param {*} conferenceId 
	 * @param {*} password 
	 */
	join(peerId, conferenceId, password) {

	}
}
export let conferenceComponent = new ConferenceComponent()