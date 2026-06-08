function flattenBookmarks(nodes, result = []) {
  for (const node of nodes) {
    if (node.url) {
      result.push({
        title: node.title,
        url: node.url,
        id: node.id,
        parentId: node.parentId,
      });
    }

    if (node.children) {
      flattenBookmarks(node.children, result);
    }
  }
  return result;
}

async function getAllBookmarks() {
  try {
    const bookmarkTreeNodes = await chrome.bookmarks.getTree();
    const allBookmarks = flattenBookmarks(bookmarkTreeNodes);

    console.log("All extracted bookmarks:", allBookmarks);
    return allBookmarks;
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
  }
}

getAllBookmarks();
