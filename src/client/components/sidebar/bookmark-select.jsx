/**
 * bookmark select
 */

import { auto } from 'manate/react'
import TreeList from '../tree-list/tree-list'

export default auto(function BookmarkSelect (props) {
  const { store, from } = props
  const {
    listStyle,
    leftSidebarWidth,
    expandedKeys,
    bookmarks,
    bookmarksMap
  } = store
  // 移除 openedSideBar 检查，书签面板现在始终显示
  const onClickItem = (item) => {
    // 书签面板常驻显示，不再需要关闭侧边栏
    store.onSelectBookmark(item.id)
  }
  const base = {
    bookmarks: bookmarks || [],
    type: 'bookmarks',
    onClickItem,
    listStyle,
    staticList: true
  }
  const propsTree = {
    ...base,
    shouldConfirmDel: true,
    bookmarksMap,
    bookmarkGroups: store.getBookmarkGroupsTotal(),
    expandedKeys,
    leftSidebarWidth,
    bookmarkGroupTree: store.bookmarkGroupTree
  }
  return (
    <TreeList
      {...propsTree}
    />
  )
})
