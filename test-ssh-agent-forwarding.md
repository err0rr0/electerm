# SSH Agent Forwarding 功能测试

## 已完成的修改

### 1. UI配置更改 (src/client/components/bookmark-form/config/common-fields.js)
- 在`sshSettings`数组中添加了`forwardAgent`开关选项
- 配置为switch类型，使用valuePropName: 'checked'

### 2. SSH连接逻辑更改 (src/app/server/session-ssh.js)  
- 在`buildConnectOptions`方法中添加了agent forwarding逻辑
- 当`initOptions.forwardAgent === true`时，设置`connectOptions.agentForward = true`

### 3. 默认配置更改 (src/client/components/bookmark-form/config/ssh.js)
- 在初始值配置中添加了`forwardAgent: false`默认值

## 功能说明

SSH Agent Forwarding允许在SSH连接中转发本地SSH agent，这样在远程服务器上可以使用本地的SSH密钥进行进一步的SSH连接，而无需在远程服务器上存储私钥。

## 使用方法

1. 打开SSH连接配置
2. 在"设置"标签页中找到"Forward Agent"选项
3. 启用该选项
4. 保存配置并连接

## 翻译说明

由于electerm使用外部的`@electerm/electerm-locales`包处理多语言，需要在该包中添加`forwardAgent`翻译键值：

- 英文: "Forward Agent"
- 中文: "转发代理" 或 "SSH代理转发"

## 技术细节

SSH agent forwarding通过SSH2协议的`agentForward`选项实现，该选项告诉SSH客户端在建立连接时启用agent forwarding功能。

### 修复的问题

原始实现中遇到了"You must set a valid agent path to allow agent forwarding"错误。修复包括：

1. **连接选项配置** - 确保SSH_AUTH_SOCK环境变量存在时才启用agent forwarding
2. **Shell选项配置** - 在shell创建时也启用agent forwarding
3. **错误处理** - 当SSH_AUTH_SOCK不存在时记录警告但不会导致连接失败

### 前置条件

使用SSH agent forwarding需要：

#### Windows系统：
Windows 10/11自带OpenSSH，但需要启动SSH Agent服务：
1. 以管理员身份运行PowerShell
2. 启动SSH Agent服务：
   ```powershell
   # 启动SSH Agent服务
   Start-Service ssh-agent
   
   # 设置为自动启动
   Set-Service -Name ssh-agent -StartupType Automatic
   
   # 添加SSH密钥
   ssh-add C:\Users\YourUsername\.ssh\id_rsa
   
   # 检查已加载的密钥
   ssh-add -l
   ```

#### Linux/macOS系统：
- 本地运行SSH agent（ssh-agent）
- 设置SSH_AUTH_SOCK环境变量
- SSH agent中已加载私钥（通过ssh-add）

可以通过以下命令检查：
```bash
# 检查SSH agent是否运行
echo $SSH_AUTH_SOCK

# 检查已加载的密钥
ssh-add -l
```

## 故障排除

### 1. 服务器端配置检查
SSH agent forwarding需要远程服务器支持，请检查：

```bash
# 检查SSH服务器配置
sudo grep -i allowagentforwarding /etc/ssh/sshd_config
```
应该显示：`AllowAgentForwarding yes`

### 2. 调试步骤

#### 查看electerm日志
Electerm使用electron-log记录日志，日志文件位置：
- **Windows**: `%USERPROFILE%\AppData\Roaming\electerm\logs\main.log`
- **macOS**: `~/Library/Logs/electerm/main.log`
- **Linux**: `~/.config/electerm/logs/main.log`

#### 调试步骤：
1. 启用SSH agent forwarding选项
2. 连接SSH服务器
3. 查看日志文件中是否有以下消息：
   - `SSH agent forwarding enabled with SSH_AUTH_SOCK: [path]`
   - 如果没有这条消息，说明本地SSH agent未运行
4. 在远程shell中运行测试：
   ```bash
   echo $SSH_AUTH_SOCK
   ssh-add -l
   ```

### 3. 测试SSH agent forwarding
在远程服务器上测试agent forwarding是否工作：
```bash
# 应该显示你本地加载的密钥
ssh-add -l

# 测试使用forwarded agent连接到另一台服务器
ssh -T git@github.com
```

### 4. 常见问题
- 如果`$SSH_AUTH_SOCK`为空，可能是远程服务器不支持agent forwarding
- 如果`ssh-add -l`显示"Could not open a connection to your authentication agent"，说明agent forwarding未正常工作
- 确保本地SSH agent正在运行并已加载密钥
