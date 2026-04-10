import { createSupabaseAdminClient } from './supabase'

// Get Supabase admin client for database operations
const getSupabase = () => createSupabaseAdminClient()

export interface User {
  id: string
  full_name: string
  email: string
  phone: string
  country: string
  user_type: 'investor' | 'property_owner' | 'agent' | 'developer'
  newsletter_subscribed: boolean
  wallet_address?: string
  oauth_provider?: string
  oauth_id?: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface Agent {
  id: number
  user_id: string
  license_number: string
  experience: string
  specialization: string
  city: string
  agency?: string
  phone: string
  status: 'pending' | 'approved' | 'rejected'
  commission_rate?: number
  total_sales?: number
  rating?: number
  created_at: string
  full_name?: string
  email?: string
}

export interface Message {
  id: number
  user_id: string
  manager_name: string
  subject: string
  message: string
  priority: 'normal' | 'high' | 'urgent'
  status: 'unread' | 'read' | 'replied'
  sender_type: 'user' | 'agent'
  receiver_type: 'user' | 'agent'
  created_at: string
  replied_at?: string
  reply_message?: string
}

export interface Property {
  id: number
  title: string
  description?: string
  location: string
  price: number
  token_price: number
  total_tokens: number
  available_tokens: number
  property_type: string
  owner_id: string
  image_url?: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface Investment {
  id: number
  property_id: number
  user_id: string
  tokens_purchased: number
  total_amount: number
  purchase_date: string
  status: 'active' | 'sold' | 'cancelled'
  roi_percentage?: number
  created_at: string
  properties?: Property
}

export interface VideoCall {
  id: number
  caller_id: string
  agent_id: string
  agent_name: string
  caller_name: string
  room_id: string
  status: 'pending' | 'active' | 'rejected' | 'ended'
  created_at: string
  updated_at: string
  ended_at?: string
}

export interface UserTokens {
  id: number
  user_id: string
  token_balance: number
  total_purchased: number
  total_spent: number
  last_purchase_at?: string
  created_at: string
  updated_at: string
}

export interface TokenTransaction {
  id: number
  user_id: string
  transaction_type: 'purchase' | 'spend' | 'refund'
  token_amount: number
  pkr_amount: number
  payment_method: string
  payment_reference?: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  description?: string
  created_at: string
  completed_at?: string
}

export interface PaymentMethod {
  id: number
  method_name: string
  display_name: string
  is_active: boolean
  processing_fee_percent: number
  min_amount: number
  max_amount: number
  created_at: string
}

// Database query helpers using Supabase
export const db = {
  // User queries
  async getUserByEmail(email: string): Promise<User | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) return null
    return data
  },

  async getUserById(id: string): Promise<User | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  async createUser(data: {
    id: string
    full_name: string
    email: string
    phone: string
    country: string
    user_type: string
    newsletter_subscribed: boolean
    wallet_address?: string
  }): Promise<string> {
    const supabase = getSupabase()
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        country: data.country,
        user_type: data.user_type,
        newsletter_subscribed: data.newsletter_subscribed,
        wallet_address: data.wallet_address || null,
      })
      .select()
      .single()

    if (error) throw error
    return user.id
  },

  // Agent queries
  async createAgent(data: {
    user_id: string
    license_number: string
    experience: string
    specialization: string
    city: string
    agency?: string
    phone: string
  }): Promise<void> {
    const supabase = getSupabase()
    // New agents are automatically approved to appear in Find Agent section
    // and admin dashboard immediately after registration
    const { error } = await supabase
      .from('agents')
      .insert({
        user_id: data.user_id,
        license_number: data.license_number,
        experience: data.experience,
        specialization: data.specialization,
        city: data.city,
        agency: data.agency || null,
        phone: data.phone,
        status: 'approved', // Auto-approve new agents
      })

    if (error) throw error
  },

  async getAgents(): Promise<Agent[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('agents')
      .select(`
        *,
        users!inner (
          full_name,
          email
        )
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Flatten the nested user data
    return data.map((agent: any) => ({
      ...agent,
      full_name: agent.users.full_name,
      email: agent.users.email,
    }))
  },

  async getAgentByUserId(userId: string): Promise<Agent | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) return null
    return data
  },

  // Message queries
  async createMessage(data: {
    user_id: string
    manager_name: string
    subject: string
    message: string
    priority: string
    sender_type: string
    receiver_type: string
  }): Promise<number> {
    const supabase = getSupabase()
    const { data: message, error } = await supabase
      .from('manager_messages')
      .insert({
        user_id: data.user_id,
        manager_name: data.manager_name,
        subject: data.subject,
        message: data.message,
        priority: data.priority,
        sender_type: data.sender_type,
        receiver_type: data.receiver_type,
      })
      .select()
      .single()

    if (error) throw error
    return message.id
  },

  async getUserMessages(userId: string): Promise<Message[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('manager_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getAgentMessages(agentName: string): Promise<Message[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('manager_messages')
      .select(`
        *,
        users!inner (
          full_name,
          email
        )
      `)
      .eq('manager_name', agentName)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Flatten user data
    return data.map((msg: any) => ({
      ...msg,
      user_name: msg.users.full_name,
      user_email: msg.users.email,
    }))
  },

  async updateMessageStatus(messageId: number, status: string): Promise<void> {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('manager_messages')
      .update({ status })
      .eq('id', messageId)

    if (error) throw error
  },

  async replyToMessage(messageId: number, replyMessage: string): Promise<void> {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('manager_messages')
      .update({
        status: 'replied',
        reply_message: replyMessage,
        replied_at: new Date().toISOString(),
      })
      .eq('id', messageId)

    if (error) throw error
  },

  async deleteMessage(messageId: number): Promise<void> {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('manager_messages')
      .delete()
      .eq('id', messageId)

    if (error) throw error
  },

  // Token queries
  async getUserTokens(userId: string): Promise<UserTokens | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) return null
    return data
  },

  async createOrUpdateUserTokens(userId: string): Promise<UserTokens> {
    const supabase = getSupabase()

    // Try to get existing record
    const existing = await this.getUserTokens(userId)

    if (existing) {
      return existing
    }

    // Create new record
    const { data, error } = await supabase
      .from('user_tokens')
      .insert({
        user_id: userId,
        token_balance: 0,
        total_purchased: 0,
        total_spent: 0,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async createTokenTransaction(data: {
    user_id: string
    transaction_type: string
    token_amount: number
    pkr_amount: number
    payment_method: string
    payment_reference?: string
    description?: string
  }): Promise<number> {
    const supabase = getSupabase()
    const { data: transaction, error } = await supabase
      .from('token_transactions')
      .insert({
        user_id: data.user_id,
        transaction_type: data.transaction_type,
        token_amount: data.token_amount,
        pkr_amount: data.pkr_amount,
        payment_method: data.payment_method,
        payment_reference: data.payment_reference || null,
        description: data.description || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return transaction.id
  },

  async updateTransactionStatus(
    transactionId: number,
    status: string,
    paymentReference?: string
  ): Promise<void> {
    const supabase = getSupabase()
    const updateData: any = {
      status,
      ...(status === 'completed' && { completed_at: new Date().toISOString() }),
      ...(paymentReference && { payment_reference: paymentReference }),
    }

    const { error } = await supabase
      .from('token_transactions')
      .update(updateData)
      .eq('id', transactionId)

    if (error) throw error
  },

  async getUserTransactions(userId: string, limit: number = 20): Promise<TokenTransaction[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('method_name')

    if (error) throw error
    return data
  },

  async getTransactionById(transactionId: number): Promise<TokenTransaction | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (error) return null
    return data
  },

  // ============================================
  // VIDEO CALLS FUNCTIONS
  // ============================================

  async createVideoCall(callData: {
    caller_id: string
    agent_id: string
    agent_name: string
    caller_name: string
    room_id: string
  }): Promise<VideoCall> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('video_calls')
      .insert([callData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getAgentPendingCalls(agentId: string): Promise<VideoCall[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('video_calls')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async updateCallStatus(callId: number, status: string): Promise<void> {
    const supabase = getSupabase()
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'ended') {
      updates.ended_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('video_calls')
      .update(updates)
      .eq('id', callId)

    if (error) throw error
  },

  async getCallById(callId: number): Promise<VideoCall | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('video_calls')
      .select('*')
      .eq('id', callId)
      .single()

    if (error) return null
    return data
  },

  // ============================================
  // PROPERTIES FUNCTIONS
  // ============================================

  async getProperties(): Promise<Property[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getPropertyById(id: number): Promise<Property | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  async createProperty(propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<Property> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('properties')
      .insert([propertyData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateProperty(id: number, updates: Partial<Property>): Promise<Property> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ============================================
  // INVESTMENTS FUNCTIONS
  // ============================================

  async getUserInvestments(userId: string): Promise<Investment[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('investments')
      .select(`
        *,
        properties (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async createInvestment(investmentData: {
    property_id: number
    user_id: string
    tokens_purchased: number
    total_amount: number
  }): Promise<Investment> {
    const supabase = getSupabase()

    // First, update available tokens in property
    const { data: property } = await supabase
      .from('properties')
      .select('available_tokens')
      .eq('id', investmentData.property_id)
      .single()

    if (!property) throw new Error('Property not found')

    const newAvailableTokens = property.available_tokens - investmentData.tokens_purchased
    if (newAvailableTokens < 0) throw new Error('Not enough tokens available')

    // Update property tokens
    await supabase
      .from('properties')
      .update({ available_tokens: newAvailableTokens })
      .eq('id', investmentData.property_id)

    // Create investment
    const { data, error } = await supabase
      .from('investments')
      .insert([investmentData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getInvestmentById(id: number): Promise<Investment | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('investments')
      .select(`
        *,
        properties (*)
      `)
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  async getAllInvestments(): Promise<Investment[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('investments')
      .select(`
        *,
        properties (*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },
}
