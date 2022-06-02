
import { Component } from '../common/react-subx'
import Session from '../session'
import Tabs from '../tabs'
import _ from 'lodash'
import copy from 'json-deep-copy'
import ContextMenu from '../common/context-menu'
import FileInfoModal from '../sftp/file-props-modal'
import FileModeModal from '../sftp/file-mode-modal'
import UpdateCheck from './upgrade'
import SettingModal from '../setting-panel/setting-modal'
import TextEditor from '../text-editor'
import TextEditorSystem from '../text-editor/edit-with-system-editor'
import Sidebar from '../sidebar'
import SystemMenu from './system-menu'
import CssOverwrite from './css-overwrite'
import UiTheme from './ui-theme'
import TerminalInteractive from '../terminal/terminal-interactive'
import classnames from 'classnames'
import { isMac, isWin } from '../../common/constants'
import TermFullscreenControl from './term-fullscreen-control'
import { init } from '../../common/fetch-from-server'
import Footer from '../footer/footer-entry'
import QuickCommandsFooterBox from '../quick-commands/quick-commands-box'
import TermSearch from '../common/term-search'
import './wrapper.styl'

export default class Index extends Component {
  componentDidMount () {
    const { store } = this.props
    window.lang = copy(window.lang)
    window._config = copy(window._config)
    window.addEventListener('resize', store.onResize)
    store.onResize()
    const { ipcOnEvent } = window.pre
    ipcOnEvent('checkupdate', store.onCheckUpdate)
    ipcOnEvent('open-about', store.openAbout)
    ipcOnEvent('new-ssh', store.onNewSsh)
    ipcOnEvent('add-tab-from-command-line', store.addTabFromCommandLine)
    ipcOnEvent('openSettings', store.openSetting)
    ipcOnEvent('selectall', store.selectall)
    ipcOnEvent('focused', store.focus)
    ipcOnEvent('blur', store.onBlur)
    ipcOnEvent('window-move', store.onResize)

    document.addEventListener('drop', function (e) {
      e.preventDefault()
      e.stopPropagation()
    })
    document.addEventListener('dragover', function (e) {
      e.preventDefault()
      e.stopPropagation()
    })
    window.addEventListener('offline', store.setOffline)
    store.zoom(store.config.zoom, false, true)
    store.isSencondInstance = window.pre.runSync('isSencondInstance')
    store.initData()
    store.checkForDbUpgrade()
    init()
  }

  render () {
    const { store } = this.props
    const {
      currentTabId,
      contextMenuProps,
      contextMenuVisible,
      fileInfoModalProps,
      fileModeModalProps,
      textEditorProps,
      textEditorSystemProps,
      storeAssign,
      updateConfig,
      config,
      terminalFullScreen,
      pinned,
      isSencondInstance,
      pinnedQuickCommandBar
    } = store
    const tabs = store.getTabs()
    const cls = classnames({
      'system-ui': window._config.useSystemTitleBar,
      'is-mac': isMac,
      'is-win': isWin,
      pinned,
      'qm-pinned': pinnedQuickCommandBar,
      'term-fullscreen': terminalFullScreen,
      'is-main': !isSencondInstance
    })
    const ext1 = {
      className: cls
    }
    const cpConf = copy(config)
    const confsCss = Object
      .keys((cpConf))
      .filter(d => d.startsWith('terminalBackground'))
      .reduce((p, k) => {
        return {
          ...p,
          [k]: cpConf[k]
        }
      }, {})
    const themeProps = {
      themeConfig: store.getUiThemeConfig()
    }
    const outerProps = {
      style: {
        opacity: config.opacity
      }
    }
    const tabsProps = {
      ..._.pick(store, [
        'currentTabId',
        'height',
        'width',
        'config',
        'activeTerminalId',
        'isMaximized'
      ]),
      tabs
    }
    return (
      <div {...ext1}>
        <TermFullscreenControl
          store={store}
        />
        <CssOverwrite {...confsCss} />
        <TerminalInteractive />
        <UiTheme
          {...themeProps}
          buildTheme={store.buildTheme}
        />
        <TextEditor
          key={textEditorProps.id}
          {...textEditorProps}
          storeAssign={storeAssign}
        />
        <TextEditorSystem
          key={textEditorSystemProps.id}
          {...copy(textEditorSystemProps)}
          storeAssign={storeAssign}
          updateConfig={updateConfig}
          config={config}
        />
        <UpdateCheck
          store={store}
        />
        <ContextMenu
          {...contextMenuProps}
          visible={contextMenuVisible}
          closeContextMenu={store.closeContextMenu}
        />
        <SystemMenu store={store} />
        <FileInfoModal
          {...fileInfoModalProps}
        />
        <FileModeModal
          key={_.get(fileModeModalProps, 'file.id') || ''}
          {...fileModeModalProps}
        />
        <SettingModal store={store} />
        <div
          id='outside-context'
          {...outerProps}
        >
          <Sidebar store={store} />
          <Tabs
            store={store}
            {...tabsProps}
          />
          <div className='ui-outer'>
            {
              tabs.map((tab) => {
                const { id } = tab
                const cls = id !== currentTabId
                  ? 'hide'
                  : 'ssh-wrap-show'
                const tabProps = {
                  tab: copy(tab),
                  ..._.pick(store, [
                    'currentTabId',
                    'height',
                    'width',
                    'activeTerminalId'
                  ]),
                  config: cpConf
                }
                return (
                  <div className={cls} key={id}>
                    <Session
                      store={store}
                      {...tabProps}
                    />
                  </div>
                )
              })
            }
            <TermSearch store={store} />
            <QuickCommandsFooterBox store={store} />
            <Footer store={store} />
          </div>
        </div>
      </div>
    )
  }
}
