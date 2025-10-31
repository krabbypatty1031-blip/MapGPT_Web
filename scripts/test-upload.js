/**
 * 图片上传测试脚本
 * 用于在开发环境中测试 FormData 上传是否正常工作
 */

const API_BASE_URL = 'http://10.0.2.2:8787';

// 测试 1: 使用 fetch + FormData (模拟前端不带进度的场景)
async function testFetchUpload() {
  console.log('\n=== 测试 1: fetch + FormData ===');
  
  try {
    const formData = new FormData();
    
    // 在 Node.js 环境中，需要使用文件系统读取
    // 在浏览器/RN 中，这里会是 { uri, type, name } 对象
    console.log('注意: 此脚本需要在 React Native 环境中运行');
    console.log('或者使用真实图片文件测试');
    
    // 模拟 RN 的文件对象结构
    const mockFile = {
      uri: 'file:///path/to/image.jpg',
      type: 'image/jpeg',
      name: 'test.jpg'
    };
    
    formData.append('file', mockFile);
    
    console.log('FormData 已创建，包含字段: file');
    console.log('文件信息:', mockFile);
    
    const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
      method: 'POST',
      body: formData,
      // 不设置 Content-Type，让浏览器自动添加 boundary
    });
    
    console.log('响应状态:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✓ 上传成功:', data);
    } else {
      const errorText = await response.text();
      console.error('✗ 上传失败:', errorText);
    }
  } catch (error) {
    console.error('✗ 请求异常:', error.message);
  }
}

// 测试 2: 检查 FormData 类型
function testFormDataDetection() {
  console.log('\n=== 测试 2: FormData 检测 ===');
  
  const formData = new FormData();
  formData.append('test', 'value');
  
  console.log('typeof formData.append:', typeof formData.append);
  console.log('检测结果:', typeof formData.append === 'function' ? '✓ 正确识别为 FormData' : '✗ 检测失败');
}

// 主函数
async function main() {
  console.log('图片上传测试工具');
  console.log('===================');
  
  testFormDataDetection();
  
  console.log('\n提示: 在 React Native 中运行以下测试:');
  console.log('  await testFetchUpload();');
  
  // 如果在浏览器环境中，可以取消注释运行
  // await testFetchUpload();
}

// 如果在 Node.js 环境运行
if (typeof window === 'undefined') {
  console.log('\n警告: 这个脚本应该在 React Native 或浏览器环境中运行');
  console.log('在 Node.js 环境中 FormData 和 fetch 的行为可能不同');
}

// 导出测试函数供 RN 中使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testFetchUpload, testFormDataDetection };
}

main().catch(console.error);
