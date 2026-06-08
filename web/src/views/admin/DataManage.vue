<template>
  <div class="data-manage">
    <div class="data-card">
      <div class="data-section">
        <h2 class="page-title">数据导出 / 导入</h2>
        <p class="data-desc">导出会备份当前栏目、子菜单、卡片、广告、友链数据。导入会覆盖这些数据，但不会覆盖后台用户和密码。</p>
      </div>

      <div class="data-actions">
        <button class="btn btn-primary" :disabled="exporting" @click="handleExport">
          {{ exporting ? '导出中...' : '导出数据 JSON' }}
        </button>
      </div>
    </div>

    <div class="data-card danger-card">
      <div class="data-section">
        <h3 class="section-title">导入数据</h3>
        <p class="data-desc warning">注意：导入会先清空现有栏目、卡片、广告和友链，再写入备份文件内容。建议先导出当前数据。</p>
      </div>

      <input ref="fileInput" type="file" accept="application/json,.json" class="file-input" @change="handleFileChange" />
      <div v-if="selectedFile" class="selected-file">已选择：{{ selectedFile.name }}</div>
      <div class="data-actions">
        <button class="btn" @click="chooseFile">选择 JSON 文件</button>
        <button class="btn btn-danger" :disabled="!selectedFile || importing" @click="handleImport">
          {{ importing ? '导入中...' : '确认导入并覆盖' }}
        </button>
      </div>
    </div>

    <p v-if="message" class="message" :class="messageType">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { exportData, importData } from '../../api';

const exporting = ref(false);
const importing = ref(false);
const selectedFile = ref(null);
const fileInput = ref(null);
const message = ref('');
const messageType = ref('success');

function showMessage(text, type = 'success') {
  message.value = text;
  messageType.value = type;
}

function chooseFile() {
  fileInput.value?.click();
}

function handleFileChange(event) {
  selectedFile.value = event.target.files?.[0] || null;
  message.value = '';
}

async function handleExport() {
  exporting.value = true;
  message.value = '';
  try {
    const res = await exportData();
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nav-item-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showMessage('导出成功，备份文件已下载');
  } catch (error) {
    showMessage(error.response?.data?.message || '导出失败', 'error');
  } finally {
    exporting.value = false;
  }
}

async function handleImport() {
  if (!selectedFile.value) return;
  if (!confirm('确定要导入并覆盖当前导航数据吗？建议先导出备份。')) return;

  importing.value = true;
  message.value = '';
  try {
    const text = await selectedFile.value.text();
    const payload = JSON.parse(text);
    const res = await importData(payload);
    const imported = res.data.imported || {};
    showMessage(`导入成功：栏目 ${imported.menus || 0}，子菜单 ${imported.sub_menus || 0}，卡片 ${imported.cards || 0}，广告 ${imported.ads || 0}，友链 ${imported.friends || 0}`);
    selectedFile.value = null;
    if (fileInput.value) fileInput.value.value = '';
  } catch (error) {
    showMessage(error.response?.data?.message || error.message || '导入失败，请检查 JSON 文件', 'error');
  } finally {
    importing.value = false;
  }
}
</script>

<style scoped>
.data-manage {
  max-width: 900px;
  margin: 0 auto;
}
.data-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.12);
  padding: 24px;
  margin-bottom: 20px;
}
.danger-card {
  border: 1px solid rgba(220, 53, 69, 0.18);
}
.data-desc {
  color: #667085;
  line-height: 1.7;
  margin: 10px 0 0;
}
.warning {
  color: #b54708;
}
.data-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}
.file-input {
  display: none;
}
.selected-file {
  margin-top: 16px;
  color: #344054;
  background: #f2f4f7;
  padding: 10px 12px;
  border-radius: 10px;
}
.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
}
.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.message {
  padding: 12px 14px;
  border-radius: 10px;
  background: #ecfdf3;
  color: #027a48;
}
.message.error {
  background: #fef3f2;
  color: #b42318;
}
@media (max-width: 600px) {
  .data-card { padding: 18px; }
  .data-actions { flex-direction: column; }
}
</style>
